'use strict';

import { Order, OrderService, OrderServiceAddition, Vehicle, OrderVehicle, Location } from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { getOrCreateLocation } from '../location/index.js';
import { getCompany } from '../company/index.js';
import { validateAndGetVehicles, validateServicesAndAdditions } from '../helpers/order-helpers.js';

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
        notes,
        services,
        primary_location,
        secondary_location,
        vehicles
    } = data;

    try {

        if (!primary_location) {
            throw new AppError('Primary location is required', 400);
        }

        let validVehicles = [];
        if (vehicles && vehicles.length > 0) {
            validVehicles = await validateAndGetVehicles(vehicles, transaction);
        }

        if (services && services.length > 0) {
            await validateServicesAndAdditions(services, transaction);
        }

        const company = await getCompany({ id: data.company_id }, { transaction });
        
        let p_location = await getOrCreateLocation(primary_location, { transaction });
        let s_location = secondary_location 
            ? await getOrCreateLocation(secondary_location, { transaction }) 
            : p_location;

        let orderTotalPrice = 0;

        const order = await Order.create({
            client_id, 
            company_id: company.id,
            execution_date, 
            execution_time, 
            primary_location_id: p_location.id, 
            secondary_location_id: s_location.id,
            notes,
            status: 'pending',
            total_price: 0,
        }, { ...(transaction && { transaction }) });

        if (validVehicles.length > 0) {
            const orderVehiclesData = validVehicles.map(vehicle => ({
                order_id: order.id,
                vehicle_id: vehicle.id,
            }));

            await OrderVehicle.bulkCreate(orderVehiclesData, { ...(transaction && { transaction }) });
        }

        if (services && services.length > 0) {
            for (const service of services) {
                let serviceTotalPrice = Number(service.total_price) || 0;

                const orderService = await OrderService.create({
                    order_id: order.id,
                    service_id: service.service_id,
                    preferred_date: service.preferred_date || order.execution_date,
                    preferred_time: service.preferred_time || order.execution_time,
                    primary_location_id: service.primary_location_id || order.primary_location_id,
                    secondary_location_id: service.secondary_location_id || order.secondary_location_id,
                    pricing_type: service.pricing_type,
                    price_per_unit: service.price_per_unit,
                    minimum_charge: service.minimum_charge,
                    total_price: service.total_price,
                    details: service.details || {},
                    status: 'pending',
                    company_id: service.company_id || order.company_id,
                    min_units: service.min_units,
                    max_units: service.max_units
                }, { ...(transaction && { transaction }) });

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
                            details: add.details || {},
                            min_units: add.min_units,
                            max_units: add.max_units,
                            note: add.note
                        };
                    });

                    await OrderServiceAddition.bulkCreate(additionsData, { ...(transaction && { transaction }) });
                }

                await orderService.update({ total_price: serviceTotalPrice }, { ...(transaction && { transaction }) });
                orderTotalPrice += serviceTotalPrice;
            }
        }

        await order.update({ total_price: orderTotalPrice }, { ...(transaction && { transaction }) });

        await order.reload({
            include: [
                {
                    model: OrderService,
                    as: 'orderServices',
                    include: [
                        { model: OrderServiceAddition, as: 'additions' }
                    ]
                },
                { model: Vehicle, as: 'assigned_vehicles' },
                { model: Location, as: 'primary_location' }, 
                { model: Location, as: 'secondary_location' }
            ],
            ...(transaction && { transaction })
        });

        return { ...order.toJSON(), total_price: orderTotalPrice };
    } catch (error) {
        throw error;
    }
}