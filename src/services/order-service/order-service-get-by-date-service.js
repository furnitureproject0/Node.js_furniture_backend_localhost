'use strict';

import { OrderService, Order, Service, Company, Location, User } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';

/**
 * Get order services by date range and order type
 * @param {Object} filters - Filter criteria (startDate, endDate, orderType, status, company_id)
 * @param {Object} pagination - Pagination options
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Paginated order services
 */
export const getOrderServicesByDate = async (filters, pagination = {}, options = {}) => {
    const { transaction } = options;

    const { startDate, endDate, orderType, status, company_id } = filters;

    const orderServiceWhere = {};

    if (startDate && endDate) {
        orderServiceWhere.preferred_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
        orderServiceWhere.preferred_date = { [Op.gte]: startDate };
    } else if (endDate) {
        orderServiceWhere.preferred_date = { [Op.lte]: endDate }; 
    }

    if (status) orderServiceWhere.status = status;
    if (company_id) orderServiceWhere.company_id = company_id;

    const orderWhere = {};
    if (orderType) {
        // order, offer, appointment
        orderWhere.type = orderType;
    }

    // Pagination
    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const orderServices = await OrderService.findAndCountAll({
        where: orderServiceWhere,
        include: [
            {
                model: Order,
                as: 'order',
                where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined, // Inner Join لو في فلتر نوع
                attributes: ['id', 'status', 'type', 'notes'],
                include: [
                    { model: User, as: 'client', attributes: ['id', 'name', 'email'] }
                ]
            },
            { model: Service, as: 'service', attributes: ['id', 'name'] },
            { model: Location, as: 'toLocation', attributes: ['id', 'address', 'type'] }
        ],
        limit: limitNumber,
        offset: offset,
        order: [
            ['preferred_date', 'ASC'], 
            ['preferred_time', 'ASC']
        ],
        distinct: true,
        ...(transaction && { transaction }),
    });

    return {
        services: orderServices.rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(orderServices.count / limitNumber),
            totalItems: orderServices.count
        }
    };
};