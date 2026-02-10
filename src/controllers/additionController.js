import { Addition } from '../models/index.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { Op } from 'sequelize'

export const getAllAdditions = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, search = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const whereClause = search
        ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
            ],
        }
        : {};

    const { rows: additions, count } = await Addition.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
        success: true,
        message: "Additions retrieved successfully",
        data: {
            additions,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
            },
        },
    });
});

export const getAdditionById = asyncHandler(async (req, res) => {
    const addition = await Addition.findByPk(req.params.id);

    if (!addition) {
        throw new AppError('Addition not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Addition retrieved successfully',
        data: { addition }
    });
});

export const createAddition = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const existingAddition = await Addition.findOne({ where: { name } });
    if (existingAddition) {
        throw new AppError('Another addition with this name already exists', 409);
    }

    const addition = await Addition.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Addition created successfully',
        data: { addition },
    });
});

export const updateAddition = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const addition = await Addition.findByPk(req.params.id);

    if (!addition) {
        throw new AppError('Addition not found', 404);
    }

    const existingAddition = await Addition.findOne({
        where: {
            name,
            id: { [Op.ne]: req.params.id },
        },
    });

    if (existingAddition) {
        throw new AppError('Another addition with this name already exists', 409);
    }


    await addition.update({ name });

    res.status(200).json({
        success: true,
        message: 'Addition updated successfully',
        data: { addition },
    });
});