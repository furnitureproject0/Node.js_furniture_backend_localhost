'use strict';

// 1. Added Company to the imports
import { Order, OrderService, OrderServiceAddition, Vehicle, Location, User, Service, Addition, Company } from "../../models/index.js";
import { Op } from 'sequelize';

/**
 * Get all orders with filtering, searching, and pagination
 * @param {Object} filters - Filter criteria (status, execution_date, price range)
 * @param {string} search - Search keyword (searches across clients, locations, vehicles, and company)
 * @param {Object} pagination - Pagination parameters (page, limit)
 * @param {Object} options - Additional Sequelize options (e.g., transaction)
 * @returns {Object} Filtered, searched, and paginated list of orders
 */
export const getAllOrders = async (filters = {}, search = '', pagination = {}, options = {}) => {
    const { transaction } = options;

    const whereConditions = {};

    // Apply status and date filters if provided
    if (filters.status) whereConditions.status = filters.status;
    if (filters.execution_date) whereConditions.execution_date = filters.execution_date;
    
    // Price filter (relies on total_price which represents the max estimated price in the new logic)
    if (filters.min_price || filters.max_price) {
        whereConditions.total_price = {
            [Op.and]: [
                filters.min_price ? { [Op.gte]: filters.min_price } : {},
                filters.max_price ? { [Op.lte]: filters.max_price } : {}
            ]
        };
    }

    if (filters.type) {
        whereConditions.type = filters.type;
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
            { '$assigned_vehicles.license_plate$': { [Op.like]: searchRegex } },
            // 2. Add search by company name
            { '$company.name$': { [Op.like]: searchRegex } } 
        );
        
        whereConditions[Op.or] = searchConditions;
    }

    // Set up pagination
    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    // Execute the main query with associations
    const orders = await Order.findAndCountAll({
        where: whereConditions,
        include: [
            {
                model: User,
                as: 'client',
                attributes: ['id', 'name', 'email'],
                include: ['phones'] 
            },
            // 3. Include Company to retrieve its data and enable searching
            {
                model: Company,
                as: 'company', // Ensure this alias matches your associations in models/index.js
                attributes: ['id', 'name', 'email', 'logo'] // Select only necessary fields to keep the response lightweight
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
                    },
                    { model: Company, as: 'company', attributes: ['id', 'name'] } 
                ]
            }
        ],
        limit: limitNumber,
        offset: offset,
        order: [
            ['execution_date', 'ASC'], 
            ['execution_time', 'ASC'] 
        ],
        distinct: true, // Crucial for correct pagination when using multiple includes
        subQuery: false, // Prevents Sequelize from nesting the query incorrectly with limits
        transaction
    });

    // Convert Sequelize instances to plain JSON objects
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