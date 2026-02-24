'use strict';

import { Addition } from "../../models/index.js";
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';

/**
 * Get all active and non-deleted additions
 * @param {Object} filters - Filters for querying additions (currently unused)
 * @param {string} search - Search term for filtering additions by name (currently unused)
 * @param {Object} pagination - Pagination options (currently unused)
 * @param {Object} user - User info for permission checks (currently unused)
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Array} List of additions
 */
export const getAllAdditions = async (filters, search = '', pagination = {}, user, options = {}) => {

    const { transaction } = options;

    const whereConditions = {
        is_deleted: false,
        is_active: true
    };

    const allowedFilters = ['name', 'is_active', 'is_deleted'];

    Object.keys(filters).forEach(key => {
        if (allowedFilters.includes(key) && filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            whereConditions[key] = filters[key];
        }
    });

    const authRoles = ['super_admin'];

    if (!authRoles.includes(user.role)) {
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

    const additions = await Addition.findAndCountAll({
        where: whereConditions,
        limit: limitNumber,
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true,
        ...(transaction && { transaction }),
    });

    return {
        additions: additions.rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(additions.count / limitNumber),
            totalItems: additions.count
        }
    };
}