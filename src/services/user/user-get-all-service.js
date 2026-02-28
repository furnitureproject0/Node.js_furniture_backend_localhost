'use strict';

import { User, Phone, Location } from '../../models/index.js';
import { Op } from 'sequelize';

/**
 * Generic service to get users with search, filters, and pagination
 * @param {Object} filters - Exact match filters (role, is_verified, company_id)
 * @param {string} search - Search keyword (for name or email)
 * @param {Object} pagination - Pagination options { page, limit }
 * @param {Object} options - Options including database transaction
 * @returns {Object} Object containing users array and pagination metadata
 */
export const getUsersService = async (filters = {}, search = '', pagination = {}, options = {}) => {
    const { transaction } = options;
    
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (filters.role && filters.roles) {
        whereClause.role = {
            [Op.in]: filters.role,
            [Op.in]: filters.roles
        };
    } else if (filters.role) {
        whereClause.role = { [Op.in]: filters.role };
    } else if (filters.roles) {
        whereClause.role = { [Op.in]: filters.roles };
    }

    if (filters.is_verified !== undefined) whereClause.is_verified = filters.is_verified;
    if (filters.company_id) whereClause.company_id = filters.company_id;

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

    const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Phone,
                as: 'phones', 
                where: { owner_type: 'User' },
                required: false, 
                attributes: ['id', 'phone'],
                duplicating: false
            },
            {
                model: Location,
                as: 'location',
                required: false,
                duplicating: false
            }
        ],
        limit,
        offset,
        distinct: true, 
        subQuery: false,
        order: [['created_at', 'DESC']], 
        transaction 
    });

    return {
        users: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        }
    };
};