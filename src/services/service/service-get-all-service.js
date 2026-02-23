'use strict';

import { Service, Addition } from '../../models/index.js';
import { Op } from 'sequelize';

/**
 * Get all services with pagination and optional filtering
 * @param {Object} filters - Service data from request body
 * @param {Object} pagination - Pagination options (e.g., page, limit)
 * @param {Object} user - User object (for authorization checks)
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} filtered services list and pagination info
 */
export const getAllServices = async (filters, search = '', pagination = {}, user, options = {}) => {

    const { transaction } = options;

    const whereConditions = {
        is_deleted: false
    };

    const allowedFilters = ['name', 'is_active', 'is_deleted', 'company_id'];

    Object.keys(filters).forEach(key => {
        if (allowedFilters.includes(key) && filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            whereConditions[key] = filters[key];
        }
    });

    const authRoles = ['super_admin', 'site_admin', 'company_admin'];

    if (!authRoles.includes(user.role)) {
        whereConditions.is_active = true;
        whereConditions.is_deleted = false;
    }

    if (search && search.trim() !== '') {
        whereConditions[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
        ];
    }

    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const services = await Service.findAndCountAll({
        where: whereConditions,
        include: [{
            model: Addition,
            as: 'additions',
            where: { 
                is_deleted: false,
                is_active: true
            },
            through: { attributes: [] }
        }],
        limit: limitNumber,
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true,
        ...(transaction && { transaction }),
    });

    return {
        services: services.rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(services.count / limitNumber),
            totalItems: services.count
        }
    };
};