import User from "../models/user.js";
import OTP from "../models/otp.js";
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/sendEmail.js';
import { generateVerificationEmailTemplate, generateVerificationSuccessTemplate, generatePasswordResetEmailTemplate } from '../utils/emailTemplates.js';
import { createAndSendNotification } from '../utils/notifications.js';
import sequelize from '../config/database.js';
import { Op } from "sequelize";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const sendTokenResponse = (user, message, statusCode, res) => {
    const token = generateToken(user.id);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only send cookie over HTTPS in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res
        .status(statusCode)
        .cookie('accessToken', token, cookieOptions)
        .json({
            success: true,
            message,
            data: {
                user
            }
        });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            await transaction.rollback();
            return next(new AppError('Email not found', 404));
        }

        // Invalidate previous unused reset OTPs
        await OTP.update(
            { used: true },
            {
                where: {
                    user_id: user.id,
                    type: 'password_reset',
                    used: false
                },
                transaction
            }
        );

        const otp = generateOTP();
        await OTP.create({
            user_id: user.id,
            email: user.email,
            otp,
            type: 'password_reset',
            expires_at: new Date(Date.now() + 15 * 60 * 1000)
        }, { transaction });

        await transaction.commit();

        // Send reset email (template)
        try {
            await sendEmail({
                to: user.email,
                subject: 'Your Password Reset Code',
                html: generatePasswordResetEmailTemplate({ name: user.name, otp })
            });
        } catch (e) {
            console.error('Failed to send password reset email:', e);
        }

        // Best practice: generic response
        res.status(200).json({
            success: true,
            message: 'OTP sent to your email'
        });
    } catch (error) {
        await transaction.rollback();
        return next(new AppError('Could not initiate password reset', 500));
    }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, new_password } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const user = await User.findOne({ where: { email }, transaction });
        if (!user) {
            await transaction.rollback();
            return next(new AppError('Invalid email or code', 400));
        }

        const otpRecord = await OTP.findOne({
            where: {
                user_id: user.id,
                email: user.email,
                otp,
                type: 'password_reset',
                used: false,
                expires_at: { [Op.gt]: new Date() }
            },
            transaction
        });

        if (!otpRecord) {
            await transaction.rollback();
            return next(new AppError('Invalid or expired code', 400));
        }

        await otpRecord.update({ used: true }, { transaction });
        await user.update({ password: new_password }, { transaction });

        await transaction.commit();

        // Clean expired OTPs in background
        OTP.deleteExpired().catch(console.error);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        await transaction.rollback();
        return next(new AppError('Failed to reset password', 500));
    }
});

export const register = asyncHandler(async (req, res, next) => {
    const transaction = await sequelize.transaction();

    const userExists = await User.findOne({
        where: { email: req.body.email },
        transaction
    });

    if (userExists) {
        await transaction.rollback();
        return next(new AppError('Email already in use', 409));
    }

    const user = await User.create(req.body, { transaction });

    // Generate and save OTP
    const otp = generateOTP();
    await OTP.create({
        user_id: user.id,
        email: user.email,
        otp,
        type: 'email_verification',
        expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    }, { transaction });

    // Send verification email
    await sendEmail({
        to: user.email,
        subject: 'Verify Your Email',
        html: generateVerificationEmailTemplate({
            name: user.name,
            otp
        })
    });

    // Create welcome notification
    await createAndSendNotification({
        user_id: user.id,
        title: 'Welcome to Angebots',
        message: `Hi ${user.name}, thank you for joining Angebots! Please verify your email to get started.`,
        type: 'welcome',
    }, { transaction });

    await transaction.commit();


    sendTokenResponse(user, "User registered Successfully", 201, res)
});

export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new AppError('Invalid email or password', 401));
    }

    sendTokenResponse(user, "User logged in successfully", 200, res);
});


export const getMe = asyncHandler(async (req, res) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: {
            user
        }
    });
});



export const verifyEmail = asyncHandler(async (req, res, next) => {
    const { otp } = req.body;
    const user = req.user;
    const transaction = await sequelize.transaction();

    try {
        if (user.is_verified) {
            await transaction.rollback();
            return next(new AppError('Email is already verified', 400));
        }

        const otpRecord = await OTP.findOne({
            where: {
                user_id: user.id,
                email: user.email,
                otp,
                type: 'email_verification',
                used: false,
                expires_at: {
                    [Op.gt]: new Date()
                }
            },
            transaction
        });

        if (!otpRecord) {
            await transaction.rollback();
            return next(new AppError('Invalid or expired verification code', 400));
        }

        // Mark OTP as used
        await otpRecord.update({ used: true }, { transaction });

        // Mark user as verified
        await user.update({ is_verified: true }, { transaction });

        await transaction.commit();

        // Clean up expired OTPs
        OTP.deleteExpired().catch(console.error);

        // Send welcome notification
        try {
            await createAndSendNotification({
                user_id: user.id,
                title: 'Email Verified',
                message: `Hi ${user.name}, your email has been successfully verified! You can now explore all the features of Angebots.`,
                type: 'email_verified',
                payload: {
                    link: '/dashboard'
                }
            });

        } catch (error) {
            console.error('Failed to send welcome notification:', error);
        }

        // Send success email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Email Verified Successfully',
                html: generateVerificationSuccessTemplate({
                    name: user.name
                })
            });
        } catch (error) {
            console.error('Failed to send success email:', error);
        }

        sendTokenResponse(user, "Email Verified Successfully", 200, res);
    } catch (error) {
        console.log(error)
        await transaction.rollback();
        return next(new AppError('Verification failed. Please try again.', 500));
    }
});

export const resendVerificationCode = asyncHandler(async (req, res, next) => {
    const email = req.user.email
    const transaction = await sequelize.transaction();

    try {
        const user = await User.findOne({
            where: { email },
            transaction
        });

        if (!user) {
            await transaction.rollback();
            return next(new AppError('User not found', 404));
        }

        if (user.is_verified) {
            await transaction.rollback();
            return next(new AppError('Email is already verified', 400));
        }

        // Invalidate any existing unused OTPs
        await OTP.update(
            { used: true },
            {
                where: {
                    user_id: user.id,
                    type: 'email_verification',
                    used: false
                },
                transaction
            }
        );

        // Generate and save new OTP
        const otp = generateOTP();
        await OTP.create({
            user_id: user.id,
            email: user.email,
            otp,
            type: 'email_verification',
            expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }, { transaction });

        // Send new verification email
        await sendEmail({
            to: user.email,
            subject: 'New Verification Code',
            html: generateVerificationEmailTemplate({
                name: user.name,
                otp
            })
        });

        await transaction.commit();

        // Clean up expired OTPs
        OTP.deleteExpired().catch(console.error);

        res.status(200).json({
            success: true,
            message: 'New verification code sent successfully'
        });
    } catch (error) {
        await transaction.rollback();
        return next(new AppError('Failed to send verification code. Please try again.', 500));
    }
});

export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // should match cookie settings used on login
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
};

