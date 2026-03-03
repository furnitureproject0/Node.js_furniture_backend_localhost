'use strict';

import { Appointment, Company, User, Order } from '../../models/index.js'; 
import { Op } from 'sequelize';

/**
 * Get all appointments with pagination and filtering
 * @param {Object} filters - Filter criteria
 * @param {string} search - Search string
 * @param {Object} pagination - Pagination options
 * @param {Object} user - User object (for roles/authorization)
 * @param {Object} options - Additional options
 * @returns {Object} Paginated appointments
 */
export const getAllAppointmentsService = async (filters, search = '', pagination = {}, user, options = {}) => {
    const { transaction } = options;

    const whereConditions = {};
    const allowedFilters = ['status', 'company_id', 'client_id', 'order_id', 'expected_date'];

    Object.keys(filters).forEach(key => {
        if (allowedFilters.includes(key) && filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            whereConditions[key] = filters[key];
        }
    });

    // Role-based restrictions (Example logic based on your previous code)
    if (user && user.role === 'company_admin') {
        whereConditions.company_id = user.company_id; // Restrict to their own company
    } else if (user && user.role === 'client') {
        whereConditions.client_id = user.id; // Restrict to their own appointments
    }

    // Search logic (e.g., search by notes or client name)
    const clientIncludeWhere = {};
    if (search && search.trim() !== '') {
        whereConditions[Op.or] = [
            { notes: { [Op.like]: `%${search}%` } },
            // Searching inside the related 'client' model
            { '$client.name$': { [Op.like]: `%${search}%` } },
            { '$client.email$': { [Op.like]: `%${search}%` } },
            { '$company.name$': { [Op.like]: `%${search}%` } }
        ];
    }

    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const appointments = await Appointment.findAndCountAll({
        where: whereConditions,
        include: [
            { model: Company, as: 'company', attributes: ['id', 'name'] },
            { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
            { model: Order, as: 'order', attributes: ['id', 'status'] }
        ],
        limit: limitNumber,
        offset: offset,
        order: [
            ['expected_date', 'ASC'], 
            ['expected_time', 'ASC']
        ],
        distinct: true, // Important when using includes
        ...(transaction && { transaction })
    });

    return {
        appointments: appointments.rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(appointments.count / limitNumber),
            totalItems: appointments.count
        }
    };
};