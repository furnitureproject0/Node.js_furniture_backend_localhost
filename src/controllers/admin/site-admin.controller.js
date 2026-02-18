import asyncHandler from 'express-async-handler';
import { User, Location, Phone } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.js';
import { sendNewClientAccountCredentialsTemplate, updateClientProfileTemplate, generateVerificationEmailTemplate } from '../../utils/emailTemplates.js';
import sendEmail from '../../utils/sendEmail.js';
import { createAndSendNotification } from '../../utils/notifications.js';




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

    if (search) {
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

    if (!clients.length) {
        throw new AppError('No clients found matching the search criteria', 404);
    }

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

        const { name, email, password, birthdate, location, phones } = req.body;

        const userExists = await User.findOne({
            where: { email },
            transaction
        });

        if (userExists) {
            throw new AppError('Email already in use', 409);
        }

        const existingPhones = await Phone.findAll({
            where: {
                phone: { [Op.in]: phones },
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

        const newLocation = await Location.create(location, { transaction });

        const newUser = await User.create({
            name,
            email,
            password,
            birthdate,
            role: 'client',
            location_id: newLocation.id
        }, { transaction });

        const phonesToCreate = phones.map(phone => ({
            phone,
            owner_id: newUser.id,
            owner_type: 'User'
        }));

        await Phone.bulkCreate(phonesToCreate, { transaction });

        await sendEmail({
            to: newUser.email,
            subject: 'New Client Account Credentials',
            html: sendNewClientAccountCredentialsTemplate({
                name: newUser.name,
                email: newUser.email,
                password
            })
        });

        await createAndSendNotification({
            user_id: newUser.id,
            title: 'Welcome to Angebots',
            message: `Hi ${newUser.name}, thank you for joining Angebots! Please verify your email to get started.`,
            type: 'welcome',
        }, { transaction });


        await transaction.commit();

        res.status(201).json({
            success: true,
            message: "Client created successfully",
            data: {
                user: newUser.toJSON()
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
        if (location) {
            if (locationId) {
                await Location.update(location, { where: { id: locationId }, transaction });
            } else {
                const newLocation = await Location.create(location, { transaction });
                locationId = newLocation.id;
            }
        }

        updateData.location_id = locationId;

        await user.update(updateData, { transaction });

        if (phones) {
            await Phone.destroy({ where: { owner_id: userId, owner_type: 'User' }, transaction });
            const phonesToCreate = phones.map(phone => ({
                phone,
                owner_id: userId,
                owner_type: 'User'
            }));
            await Phone.bulkCreate(phonesToCreate, { transaction });
        }

        await sendEmail({
            to: user.email,
            subject: 'Profile Updated by Admin',
            html: updateClientProfileTemplate({
                name: user.name
            })
        });

        if (!user.is_verified) {
            await sendEmail({
                to: user.email,
                subject: 'Email Verification Required',
                html: generateVerificationEmailTemplate({
                    name: user.name,
                    verification_url: `${process.env.FRONTEND_URL}/verify-email?token=${user.verification_token}`
                })
            });
        }

        await createAndSendNotification({
            user_id: user.id,
            title: 'Profile Updated',
            message: `Hi ${user.name}, your profile has been updated by an administrator.`,
            type: 'welcome', // I update it later.
        }, { transaction });

        await transaction.commit();

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