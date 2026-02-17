import asyncHandler from 'express-async-handler';
import { User, Location, Phone } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';
import sequelize from '../../config/database.js';



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
        ...(search && {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { '$location.address$': { [Op.like]: `%${search}%` } },
                { '$location.city$': { [Op.like]: `%${search}%` } },
                { '$location.zip_code$': { [Op.like]: `%${search}%` } },
                // { 'phones.phone': { [Op.like]: `%${search}%` } },

                sequelize.literal(`
                    EXISTS (
                        SELECT 1
                        FROM phones AS p
                        WHERE p.owner_id = User.id
                        AND p.owner_type = 'User'
                        AND p.phone LIKE '%${search}%'
                    )
                `)
            ],
        }),
    };


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
                // where: {owner_type: 'User'}
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