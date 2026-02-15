import asyncHandler from 'express-async-handler';
import { User, Location } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize'


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
            }
        ],
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