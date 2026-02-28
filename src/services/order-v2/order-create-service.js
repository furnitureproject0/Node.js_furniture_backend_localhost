'use strict';

import { Order, OrderService, OrderServiceAddition, Vehicle, OrderVehicle, Location, OrderTimeline, Company } from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { getOrCreateLocation } from '../location/index.js';
import { getCompany } from '../company/index.js';
import { validateAndGetVehicles, validateServicesAndAdditions } from '../helpers/index.js';

/**
 * Create a new order with dynamic pricing (Ranges and Hybrid models)
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
        vehicles,
        timelineMessage = 'Order created successfully',
        timelineStatus = 'pending',
        type = 'order'
    } = data;

    try {
        // Basic validation for mandatory location
        if (!primary_location) {
            throw new AppError('Primary location is required', 400);
        }

        // Validate and fetch vehicle instances
        let validVehicles = [];
        if (vehicles && vehicles.length > 0) {
            validVehicles = await validateAndGetVehicles(vehicles, transaction);
        }

        // Validate service and addition availability
        if (services && services.length > 0) {
            await validateServicesAndAdditions(services, transaction);
        }

        // Fetch company and handle locations
        const company = await getCompany({ id: data.company_id }, { transaction });
        let p_location = await getOrCreateLocation(primary_location, { transaction });
        let s_location = secondary_location 
            ? await getOrCreateLocation(secondary_location, { transaction }) 
            : p_location;

        // Initialize variables for range-based total price calculation
        let orderMinPrice = 0;
        let orderMaxPrice = 0;

        // Create the master order record
        const order = await Order.create({
            client_id, 
            company_id: company.id,
            execution_date, 
            execution_time, 
            primary_location_id: p_location.id, 
            secondary_location_id: s_location.id,
            notes,
            status: 'pending',
            type: type,
            total_price: 0, // Will be updated after calculating services
        }, { ...(transaction && { transaction }) });

        // Link vehicles to the order
        if (validVehicles.length > 0) {
            const orderVehiclesData = validVehicles.map(vehicle => ({
                order_id: order.id,
                vehicle_id: vehicle.id,
            }));
            await OrderVehicle.bulkCreate(orderVehiclesData, { ...(transaction && { transaction }) });
        }

        // Process services and their dynamic pricing
        if (services && services.length > 0) {
            for (const service of services) {
                const unitPrice = Number(service.price_per_unit) || 0;
                const minUnits = Number(service.min_units) || 0;
                const maxUnits = Number(service.max_units) || minUnits;
                const fixedPrice = Number(service.fixed_price) || 0;

                // Calculate range totals (Min/Max) based on pricing type
                let serviceMinTotal = unitPrice * minUnits;
                let serviceMaxTotal = unitPrice * maxUnits;

                if (service.pricing_type === 'flat_rate') {
                    serviceMinTotal = fixedPrice;
                    serviceMaxTotal = fixedPrice;
                }

                // Create the individual order service record
                const orderService = await OrderService.create({
                    order_id: order.id,
                    service_id: service.service_id,
                    preferred_date: service.preferred_date || order.execution_date,
                    preferred_time: service.preferred_time || order.execution_time,
                    primary_location_id: service.primary_location_id || order.primary_location_id,
                    secondary_location_id: service.secondary_location_id || order.secondary_location_id,
                    pricing_type: service.pricing_type,
                    price_per_unit: unitPrice,
                    fixed_price: fixedPrice,
                    min_units: minUnits,
                    max_units: maxUnits,
                    minimum_charge: service.minimum_charge || 0,
                    min_total_price: serviceMinTotal,
                    max_total_price: serviceMaxTotal,
                    status: 'pending',
                    company_id: service.company_id || order.company_id,
                    details: service.details || {},
                }, { ...(transaction && { transaction }) });

                // Process additions for each service
                if (service.additions && service.additions.length > 0) {
                    const additionsData = service.additions.map(add => {
                        const addUnitPrice = Number(add.price_per_unit) || 0;
                        const addMinU = Number(add.min_units) || 0;
                        const addMaxU = Number(add.max_units) || addMinU;
                        const addFixed = Number(add.fixed_price) || 0;

                        let addMin = addUnitPrice * addMinU;
                        let addMax = addUnitPrice * addMaxU;

                        if (add.pricing_type === 'flat_rate') {
                            addMin = addFixed; addMax = addFixed;
                        }

                        // Aggregate addition prices into service total range
                        serviceMinTotal += addMin;
                        serviceMaxTotal += addMax;

                        return {
                            order_service_id: orderService.id,
                            addition_id: add.addition_id,
                            pricing_type: add.pricing_type,
                            price_per_unit: addUnitPrice,
                            fixed_price: addFixed,
                            min_units: addMinU,
                            max_units: addMaxU,
                            min_total_price: addMin,
                            max_total_price: addMax,
                            total_price: addMax, // Default to max for estimation
                            details: add.details || {}
                        };
                    });

                    await OrderServiceAddition.bulkCreate(additionsData, { ...(transaction && { transaction }) });
                }

                // Update calculated totals for the service instance
                await orderService.update({ 
                    min_total_price: serviceMinTotal, 
                    max_total_price: serviceMaxTotal,
                    total_price: serviceMaxTotal 
                }, { ...(transaction && { transaction }) });

                // Accumulate order-level totals
                orderMinPrice += serviceMinTotal;
                orderMaxPrice += serviceMaxTotal;
            }
        }

        // Finalize order totals and status history
        await order.update({ 
            min_total_price: orderMinPrice, 
            max_total_price: orderMaxPrice,
            total_price: orderMaxPrice 
        }, { ...(transaction && { transaction }) });

        // Record initial status in timeline
        await OrderTimeline.create({
            order_id: order.id,
            status: timelineStatus,
            message: timelineMessage
        }, { ...(transaction && { transaction }) });

        // Reload order with all nested relations for the response
        await order.reload({
            include: [
                {
                    model: OrderService,
                    as: 'orderServices',
                    include: [
                        { model: OrderServiceAddition, as: 'additions' },
                        { model: Company, as: 'company' }
                    ]
                },
                { model: Vehicle, as: 'assigned_vehicles' },
                { model: Location, as: 'primary_location' }, 
                { model: Location, as: 'secondary_location' }
            ],
            ...(transaction && { transaction })
        });

        return { ...order.toJSON(), total_price: orderMaxPrice };
    } catch (error) {
        throw error;
    }
}