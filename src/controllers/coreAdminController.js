'use strict';

import asyncHandler from 'express-async-handler';
import { User, Location, Phone, Notification, NotificationRecipient } from '../models/index.js';
import OTP from '../models/otp.js';
import AppError from '../utils/AppError.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { sendNewClientAccountCredentialsTemplate, updateClientProfileTemplate, generateVerificationEmailTemplate, accountDeletedByAdminTemplate } from '../utils/emailTemplates.js';
import sendEmail from '../utils/sendEmail.js';
import { createNotification, sendNotification, createAndSendNotification } from '../utils/notifications.js';
import { generateOTP } from '../utils/genarators/otp-generator.js';
import { generateRandomPassword } from '../utils/passwordGenerator.js';




export const searchClients = asyncHandler(async (req, res) => {
    const { search } = req.query || '';
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    if (limit <= 0 || page <=0) {
        throw new AppError('Page and limit must be positive integers', 400);
    }

    const whereClause = {
        role: 'client',
    };

    if (search && search.trim() !== '') {
        whereClause[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { '$location.address$': { [Op.like]: `%${search}%` } },
            { '$location.city$': { [Op.like]: `%${search}%` } },
            { '$location.zip_code$': { [Op.like]: `%${search}%` } },
            { '$phones.phone$': { [Op.like]: `%${search}%` } },
        ];
    }


    const { rows: clients, count } = await User.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Location,
                as: 'location',
                attributes: ['address', 'city', 'zip_code'],
                required: false
            },
            {
                model: Phone,
                as: 'phones',
                attributes: ['phone'],
                required: false,
                where: {owner_type: 'User'}
            }
        ],
        distinct: true,
        subQuery: false,
        limit,
        offset,
        attributes: ['id', 'name', 'email', 'is_verified', 'createdAt'],
        order: [['createdAt', 'DESC']],
    });

    // if (!clients.length) {
    //     throw new AppError('No clients found matching the search criteria', 404);
    // }

    res.status(200).json({
        success: true,
        message: "Clients retrieved successfully",
        data: {
            clients,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
            },
        },
    });
});

export const createClient = asyncHandler(async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        let { name, email, password, birthdate, location, phones } = req.body;

        if (!password) {
            password = generateRandomPassword();
        }

        const userExists = await User.findOne({
            where: { email },
            transaction
        });

        if (userExists) {
            throw new AppError('Email already in use', 409);
        }

        const existingPhones = await Phone.findAll({
            where: {
                phone: { [Op.in]: phones || [] },
                owner_type: 'User'
            },
            transaction
        });

        if (existingPhones.length > 0) {
            const duplicates = existingPhones.map(p => p.phone).join(', ');
            throw new AppError(
                `The following phone numbers are already in use: ${duplicates}`,
                409
            );
        }

        let locationId = null;
        if (location && location.address) {
            const newLocation = await Location.create(location, { transaction });
            locationId = newLocation.id;
        }

        const newUser = await User.create({
            name,
            email,
            password,
            birthdate,
            role: 'client',
            location_id: locationId
        }, { transaction });

        const phonesToCreate = (phones || []).map(phone => ({
            phone,
            owner_id: newUser.id,
            owner_type: 'User'
        }));

        await Phone.bulkCreate(phonesToCreate, { transaction });

        const notification = await createNotification({
            // user_id: newUser.id,
            title: 'Welcome to Angebots',
            message: `Hi ${newUser.name}, thank you for joining Angebots! Please verify your email to get started.`,
            type: 'welcome',
            actor_id: req.user.id,
            recipients: [newUser.id]
        }, { transaction });


        await transaction.commit();

        await sendNotification(notification);

        await sendEmail({
            to: newUser.email,
            subject: 'New Client Account Credentials',
            html: sendNewClientAccountCredentialsTemplate({
                name: newUser.name,
                email: newUser.email,
                password
            })
        });

        res.status(201).json({
            success: true,
            message: "Client created successfully",
            data: {
                client: newUser.toJSON()
            }
        });

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});


export const updateClient = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const userId = req.params.id;
        const { name, email, birthdate, location, phones } = req.body;
        let emailChanged = false;

        const user = await User.findByPk(userId, { transaction });

        if (!user || user.role !== 'client') {
            throw new AppError('Client not found', 404);
        }

        let updateData = {};

        if (name && name !== user.name) {
            updateData.name = name;
        }

        if (birthdate && birthdate !== user.birthdate) {
            updateData.birthdate = birthdate;
        }

        let otp = null;
        if (email && email !== user.email) {
            const emailExists = await User.findOne({
                where: { email },
                transaction
            });

            if (emailExists) {
                throw new AppError('Email already in use', 409);
            }

            updateData.email = email;
            updateData.is_verified = false; // Mark as unverified if email changes
            emailChanged = true;

            // Generate and save OTP
            otp = generateOTP();
            await OTP.create({
                user_id: user.id,
                email: updateData.email,
                otp,
                type: 'email_verification',
                expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }, { transaction });
        }

        if (phones && phones.length > 0) {
            const existingPhones = await Phone.findAll({
                where: {
                    phone: { [Op.in]: phones },
                    owner_type: 'User',
                    owner_id: { [Op.ne]: userId }
                },
                transaction
            });

            if (existingPhones.length > 0) {
                const duplicates = existingPhones.map(p => p.phone).join(', ');
                throw new AppError(
                    `The following phone numbers are already in use: ${duplicates}`,
                    409
                );
            }
        }

        let locationId = user.location_id;
        if (location && Object.keys(location).length > 0) {
            if (locationId) {
                await Location.update(location, { where: { id: locationId }, transaction });
            } else {
                const newLocation = await Location.create(location, { transaction });
                locationId = newLocation.id;
            }
        }

        updateData.location_id = locationId;

        await user.update(updateData, { transaction });

        if (phones && phones.length > 0) {
            await Phone.destroy({ where: { owner_id: userId, owner_type: 'User' }, transaction });
            const phonesToCreate = phones.map(phone => ({
                phone,
                owner_id: userId,
                owner_type: 'User'
            }));
            await Phone.bulkCreate(phonesToCreate, { transaction });
        }

        const notification = await createNotification({
            // user_id: user.id,
            title: 'Profile Updated',
            message: `Hi ${ updateData.name || user.name }, your profile has been updated by an administrator.`,
            type: 'update', 
            actor_id: req.user.id,
            recipients: [user.id]
        }, { transaction });

        await transaction.commit();

        await sendNotification(notification);

        if (emailChanged) {
            await sendEmail({
                to: updateData.email,
                subject: 'Verify Your Email',
                html: generateVerificationEmailTemplate({
                    name: updateData.name || user.name,
                    otp
                })
            });
        } else {
                await sendEmail({
                to: user.email,
                subject: 'Profile Updated by Admin',
                html: updateClientProfileTemplate({
                    name: user.name
                })
            });
        }

        res.status(200).json({
            success: true,
            message: "Client updated successfully",
            data: {
                user: await User.findByPk(userId, {
                    include: [
                        { model: Location, as: 'location', attributes: ['address', 'city', 'zip_code'] },
                        { model: Phone, as: 'phones', attributes: ['phone'], where: { owner_type: 'User' }, required: false }
                    ]
                })
            }
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});


export const deleteClient = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const userId = req.params.id;

        const user = await User.findByPk(userId, { transaction });

        if (!user || user.role !== 'client') {
            throw new AppError('Client not found', 404);
        }

        await Phone.destroy({ 
            where: { owner_id: userId, owner_type: 'User' }, 
            transaction 
        });
        
        if (user.location_id) {
            await Location.destroy({ 
                where: { id: user.location_id }, 
                transaction 
            });
        }

        await NotificationRecipient.destroy({
            where: { user_id: userId },
            transaction
        });

        await Notification.destroy({
            where: {
                id: sequelize.literal(`NOT EXISTS (
                    SELECT 1 FROM notification_recipients 
                    WHERE notification_recipients.notification_id = notifications.id
                )`)
            },
            transaction
        });

        await OTP.destroy({
            where: { user_id: userId },
            transaction
        });

        await user.destroy({ transaction });

        const notification = await createNotification({
            // user_id: req.user.id,
            title: 'Account Deleted',
            message: `Hi ${user.name}, your account has been deleted by an administrator.`,
            type: 'account',
            actor_id: req.user.id,
            recipients: [req.user.id]
        }, { transaction });

        await transaction.commit();

        await sendNotification(notification);

        await sendEmail({
            to: user.email,
            subject: 'Account Deleted by Admin',
            html: accountDeletedByAdminTemplate({
                name: user.name
            })
        });

        res.status(200).json({
            success: true,
            message: "Client deleted successfully"
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});