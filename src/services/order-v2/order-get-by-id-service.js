'use strict';

import { Order, OrderService, OrderServiceAddition, Vehicle, Location, User, Service, Addition, Company, Phone } from "../../models/index.js";
import AppError from "../../utils/AppError.js";

/**
 * Get order by ID with all associated data
 * @param {number} orderId - ID of the order to retrieve
 * @param {Object} options - Additional Sequelize options (e.g., transaction)
 * @returns {Object} 
 */
export const getOrderById = async (orderId, type, options = {}) => {
    const { transaction } = options;

    if(!type || type === '') {
        throw new AppError('Order type is required', 400);
    }

    const order = await Order.findOne({
        where: { 
            id: orderId,
            type: type
         },
        include: [
            {
                model: User,
                as: 'client',
                attributes: ['id', 'name', 'email'],
                include: [
                    {
                        model: Phone,
                        as: 'phones',
                        attributes: ['id', 'phone']
                    }
                ]
            },
            {
                model: Location,
                as: 'primary_location',
                attributes: ['id', 'address']
            },
            {
                model: Location,
                as: 'secondary_location',
                attributes: ['id', 'address']
            },
            {
                model: Vehicle,
                as: 'assigned_vehicles',
                attributes: ['id', 'license_plate']
            },
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name']
            },
            {
                model: OrderService,
                as: 'orderServices',
                include: [
                    {
                        model: Service,
                        as  : 'service',
                        attributes: ['id', 'name', 'description']
                    },
                    // {
                    //     model: Location,
                    //     as: 'primary_location',
                    //     attributes: ['id', 'address']
                    // },
                    // {
                    //     model: Location,
                    //     as: 'secondary_location',
                    //     attributes: ['id', 'address']
                    // },
                    {
                        model: OrderServiceAddition,
                        as: 'additions',
                        include: [
                            {
                                model: Addition,
                                as: 'Addition',
                                attributes: ['id', 'name', 'description']
                            }
                        ]
                    },
                    {
                        model: Company,
                        as: 'company',
                        attributes: ['id', 'name']
                    }
                ]
            }
        ],
        transaction
    });

    return order;
};