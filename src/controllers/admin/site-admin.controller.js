import asyncHandler from 'express-async-handler';
import { User, Location, Phone } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.js';
import { sendNewClientAccountCredentialsTemplate } from '../../utils/emailTemplates.js';
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

        // await createAndSendNotification({
        //     user_id: user.id,
        //     title: 'Welcome to Angebots',
        //     message: `Hi ${user.name}, thank you for joining Angebots! Please verify your email to get started.`,
        //     type: 'welcome',
        // }, { transaction });


        await transaction.commit();

        res.status(201).json({
            success: true,
            message: "Client created successfully",
            data: newUser.toJSON()
        });

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});
