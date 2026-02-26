'use strict';

import { Order, OrderService, OrderServiceAddition, Vehicle, Location, User, Service, Addition } from "../../models/index.js";
import { Op } from 'sequelize';

/**
 * Get all orders with filtering, searching, and pagination
 * @param {*} filters 
 * @param {*} search 
 * @param {*} pagination 
 * @param {*} options 
 * @returns Filtered, searched, and paginated list of orders
 */

export const getAllOrders = async (filters = {}, search = '', pagination = {}, options = {}) => {
    const { transaction } = options;

    const whereConditions = {};

    if (filters.status) whereConditions.status = filters.status;
    if (filters.execution_date) whereConditions.execution_date = filters.execution_date;
    if (filters.min_price || filters.max_price) {
        whereConditions.total_price = {
            [Op.and]: [
                filters.min_price ? { [Op.gte]: filters.min_price } : {},
                filters.max_price ? { [Op.lte]: filters.max_price } : {}
            ]
        };
    }

    const searchConditions = [];
    if (search && search.trim() !== '') {
        const searchRegex = `%${search}%`;
        
        searchConditions.push(
            { id : { [Op.like]: searchRegex } },
            { notes: { [Op.like]: searchRegex } },
            { '$client.name$': { [Op.like]: searchRegex } },
            { '$client.email$': { [Op.like]: searchRegex } },
            { '$client.phones.phone$': { [Op.like]: searchRegex } },
            { '$primary_location.address$': { [Op.like]: searchRegex } },
            { '$secondary_location.address$': { [Op.like]: searchRegex } },
            { '$assigned_vehicles.license_plate$': { [Op.like]: searchRegex } }
        );
        
        whereConditions[Op.or] = searchConditions;
    }

    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const orders = await Order.findAndCountAll({
        where: whereConditions,
        include: [
            {
                model: User,
                as: 'client',
                attributes: ['id', 'name', 'email'],
                include: ['phones'] 
            },
            {
                model: Location,
                as: 'primary_location',
                attributes: ['id', 'address', 'lat', 'lon']
            },
            {
                model: Location,
                as: 'secondary_location',
                attributes: ['id', 'address', 'lat', 'lon']
            },
            {
                model: Vehicle,
                as: 'assigned_vehicles',
                attributes: ['id', 'license_plate', 'name'],
                through: { attributes: [] }
            },
            {
                model: OrderService,
                as: 'orderServices',
                include: [
                    { model: Service, as: 'service', attributes: ['name'] },
                    { 
                        model: OrderServiceAddition, 
                        as: 'additions',
                        include: [{ model: Addition, as: 'Addition', attributes: ['name'] }]
                    }
                ]
            }
        ],
        limit: limitNumber,
        offset: offset,
        order: [
            ['execution_date', 'ASC'], 
            ['execution_time', 'ASC'] 
        ],
        distinct: true,
        subQuery: false, 
        transaction
    });

    const plainOrders = orders.rows.map(order => {
        return order.get({ plain: true });
    });

    return {
        orders: plainOrders,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(orders.count / limitNumber),
            totalItems: orders.count
        }
    };
};