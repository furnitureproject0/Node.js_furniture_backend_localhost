'use strict';

// services/vehicleService.js
import { Vehicle } from '../../models/index.js';
import { Op } from 'sequelize';
import AppError from '../../utils/AppError.js';

/**
 * Get all vehicles with pagination and optional filtering
 * @param {Object} filters - Filters for vehicles (e.g., company_id, status)
 * @param {Object} pagination - Pagination options (e.g., page, limit)
 * @param {Object} user - User object (for authorization checks)
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} List of vehicles and pagination info
 */
export const getAllVehicles = async (filters = {}, search = '', pagination = {}, user, options = {}) => {

    const { transaction } = options;

    const whereConditions = {};

    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            whereConditions[key] = filters[key];
        }
    });

    if (search && search.trim() !== '') {
        whereConditions[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { model: { [Op.like]: `%${search}%` } },
            { license_plate: { [Op.like]: `%${search}%` } },
            { '$company.name$': { [Op.like]: `%${search}%` } },
        ];
    }

    // Authorization
    // if (user.role === 'company_admin') {

    //     if (filters.company_id && filters.company_id != user.company_id) {
    //         throw new AppError('Forbidden: cannot access vehicles from another company', 403);
    //     }

    //     whereConditions.company_id = user.company_id;
    // }

    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const vehicles = await Vehicle.findAndCountAll({
        where: whereConditions,
        include: [
            {
                association: 'company',
                attributes: ['id', 'name']
            }
        ],
        limit: limitNumber,
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true,
        ...(transaction && { transaction }),
    });

    return {
        vehicles: vehicles.rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(vehicles.count / limitNumber),
            totalItems: vehicles.count
        }
    };
}