'use strict';

import { Order, OrderService, OrderServiceAddition } from "../../models/index.js";
import AppError from "../../utils/AppError.js";

/**
 * Create a new order
 * @param {Object} data - Order data from request body
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Created order
 */

export const createOrderService = async (data, options = {}) => {

    const { transaction } = options;

    const {
        client_id, 
        execution_date, 
        execution_time, 
        primary_location_id, 
        secondary_location_id,
        total_price,
        notes,
        services    
    } = data;

    try {
        let orderTotalPrice = 0;

        const order = await Order.create({
            client_id, 
            execution_date, 
            execution_time, 
            primary_location_id, 
            secondary_location_id,
            total_price,
            notes,
            status: 'pending',
            total_price: 0,
        },
        {
            ...(transaction && { transaction })
        });

        if (services && services.length > 0) {
            for (const service of services) {
                let serviceTotalPrice = Number(service.total_price) || 0;

                const orderService = await OrderService.create({
                    order_id: order.id,
                    service_id: service.service_id,
                    primary_location_id: service.primary_location_id || order.primary_location_id,
                    secondary_location_id: service.secondary_location_id || order.secondary_location_id,
                    pricing_type: service.pricing_type,
                    price_per_unit: service.price_per_unit,
                    minimum_charge: service.minimum_charge,
                    total_price: service.total_price,
                    details: service.details || {},
                    status: 'pending'
                }, { 
                    ...(transaction && { transaction })
                });

                if (service.additions && service.additions.length > 0) {
                    const additionsData = service.additions.map(add => {
                        serviceTotalPrice += Number(add.total_price) || 0;

                        return {
                            order_service_id: orderService.id,
                            addition_id: add.addition_id,
                            pricing_type: add.pricing_type,
                            price_per_unit: add.price_per_unit,
                            minimum_charge: add.minimum_charge,
                            total_price: add.total_price,
                            details: add.details || {}
                        };
                    });

                    await OrderServiceAddition.bulkCreate(additionsData, { 
                        ...(transaction && { transaction })
                     });
                }

                await orderService.update({ total_price: serviceTotalPrice }, { 
                    ...(transaction && { transaction })
                });
                orderTotalPrice += serviceTotalPrice;
            }
        }

        await newOrder.update({ total_price: orderTotalPrice }, { 
            ...(transaction && { transaction })
        });

        order.reload({
            include: [
            {
                model: OrderService,
                include: [
                    { 
                        model: OrderServiceAddition
                    }
                ]
            }
        ]
        })

        return { ...order.toJSON(), total_price: orderTotalPrice };
    } catch (error) {
        throw error;
    }
}