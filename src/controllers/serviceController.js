import Service from '../models/service.js';
import { Addition } from '../models/index.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { Op } from 'sequelize';
import ServiceAddition from '../models/service-addition.js';
import sequelize from '../config/database.js';

const validateAdditions = async (additionIds = []) => {
    if (!additionIds.length) return true;

    const normalizedIds = additionIds.map(id => Number(id));

    const additions = await Addition.findAll({
        where: { id: { [Op.in]: normalizedIds } }
    });

    if (additions.length !== normalizedIds.length) {
        const foundIds = additions.map(a => a.id);
        const invalidIds = normalizedIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Invalid addition IDs: ${invalidIds.join(', ')}`, 400);
    }

    return true;
};

export const getAllServices = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const where = search
        ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ]
        }
        : {};

    const { count, rows: services } = await Service.findAndCountAll({
        where,
        include: [{
            model: Addition,
            as: 'additions',
            through: { attributes: [] }
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: {
            services
        },
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalItems: count
        },
    });
});


export const getServiceById = asyncHandler(async (req, res) => {
    const service = await Service.findByPk(req.params.id, {
        include: [{
            model: Addition,
            as: 'additions',
            through: { attributes: [] }
        }]
    });

    if (!service) {
        throw new AppError('Service not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Service retrieved successfully',
        data: { service }
    });
});

export const createService = asyncHandler(async (req, res) => {
    const { additions, name, ...serviceData } = req.body;


    const existingService = await Service.findOne({ where: { name } });
    if (existingService) {
        throw new AppError(`Service with name "${name}" already exists`, 409)
    }

    if (additions && additions.length > 0) {
        await validateAdditions(additions);
    }

    // Transaction for creating service + relations
    const service = await sequelize.transaction(async (t) => {
        const service = await Service.create({ name, ...serviceData }, { transaction: t });

        if (additions.length > 0) {
            const serviceAdditionsData = additions.map((additionId) => ({
                serviceId: service.id,
                additionId,
            }));

            await ServiceAddition.bulkCreate(serviceAdditionsData, { transaction: t });
        }

        await service.reload({
            include: [{
                model: Addition,
                as: 'additions',
                through: { attributes: [] }
            }],
            transaction: t,
        });

        return service
    });

    res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { service },
    });
});

export const updateService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { additions = [], name, ...updateData } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
        throw new AppError('Service not found', 404);
    }

    // Check for duplicate name
    if (name && name !== service.name) {
        const existing = await Service.findOne({
            where: {
                name,
                id: { [Op.ne]: id }
            }
        });
        if (existing) {
            throw new AppError('Service name already exists', 409);
        }
    }

    if (additions && additions.length > 0) {
        await validateAdditions(additions);
    }

    const updatedService = await sequelize.transaction(async (t) => {
        await service.update({ name, ...updateData }, { transaction: t });

        if (additions) {
            // Remove old associations
            await ServiceAddition.destroy({
                where: { serviceId: service.id },
                transaction: t,
            });

            // Create new associations
            const serviceAdditionsData = additions.map((additionId) => ({
                serviceId: service.id,
                additionId,
            }));
            await ServiceAddition.bulkCreate(serviceAdditionsData, { transaction: t });
        }

        await service.reload({
            include: [{
                model: Addition,
                as: 'additions',
                through: { attributes: [] }
            }],
            transaction: t,
        });

        return service;
    });

    res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: { updatedService },
    });
});
