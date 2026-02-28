'use strict';

import { Order, OrderService, OrderServiceAddition, Vehicle, OrderVehicle, Location, Company } from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { getOrCreateLocation } from '../location/index.js';
import { getCompany } from '../company/index.js';
import { validateAndGetVehicles, validateServicesAndAdditions } from '../helpers/order-helpers.js';

/**
 * Update an existing order details and pricing ranges
 * Note: Status changes and Timeline entries are handled by a separate sync service
 */
export const updateOrderService = async (orderId, orderData = {}, options = {}) => {
    // Standardizing transaction input
    const transaction = options.transaction || options;

    const order = await Order.findByPk(orderId, { transaction });
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Business Rule: Only pending orders allow full structural updates
    if (order.status !== 'pending') {
        throw new AppError('Only pending orders can be updated', 400);
    }

    const {
        execution_date, execution_time, notes,
        services, primary_location, secondary_location,
        vehicles, client_id, company_id
    } = orderData;

    // Track price ranges for the whole order
    let orderMinPrice = 0;
    let orderMaxPrice = 0;

    // 1. Update Basic Information
    if (client_id) order.client_id = client_id;
    if (company_id) {
        const company = await getCompany({ id: company_id }, { transaction });
        order.company_id = company.id;
    }

    if (primary_location) {
        const p_location = await getOrCreateLocation(primary_location, { transaction });
        order.primary_location_id = p_location.id;
    }

    if (secondary_location) {
        const s_location = await getOrCreateLocation(secondary_location, { transaction });
        order.secondary_location_id = s_location.id;
    }

    if (execution_date) order.execution_date = execution_date;
    if (execution_time) order.execution_time = execution_time;
    if (notes) order.notes = notes;

    // 2. Sync Vehicles
    if (vehicles && vehicles.length > 0) {
        const validVehicles = await validateAndGetVehicles(vehicles, transaction);
        await OrderVehicle.destroy({ where: { order_id: orderId }, transaction });
        const orderVehiclesData = validVehicles.map(v => ({ order_id: orderId, vehicle_id: v.id }));
        await OrderVehicle.bulkCreate(orderVehiclesData, { transaction });
    }

    // 3. Re-process Services and Dynamic Pricing (Ranges & Hybrid)
    if (services && services.length > 0) {
        await validateServicesAndAdditions(services, transaction);
        
        // Fetch old service IDs for cleanup
        const oldServiceIds = await OrderService.findAll({
            where: { order_id: orderId },
            attributes: ['id'],
            transaction
        }).then(res => res.map(s => s.id));

        // Delete previous structures to rebuild with new pricing
        await OrderServiceAddition.destroy({ where: { order_service_id: oldServiceIds }, transaction });
        await OrderService.destroy({ where: { order_id: orderId }, transaction });

        for (const service of services) {
            const unitPrice = Number(service.price_per_unit) || 0;
            const minU = Number(service.min_units) || 0;
            const maxU = Number(service.max_units) || minU;
            const fixedP = Number(service.fixed_price) || 0;

            // Calculate range totals for this service
            let sMin = unitPrice * minU;
            let sMax = unitPrice * maxU;

            if (service.pricing_type === 'flat_rate') {
                sMin = fixedP; sMax = fixedP;
            }

            const createdService = await OrderService.create({
                order_id: orderId,
                service_id: service.service_id,
                primary_location_id: service.primary_location_id || order.primary_location_id,
                secondary_location_id: service.secondary_location_id || order.secondary_location_id,
                preferred_date: service.preferred_date || order.execution_date,
                preferred_time: service.preferred_time || order.execution_time,
                pricing_type: service.pricing_type || 'per_hour',
                price_per_unit: unitPrice,
                fixed_price: fixedP,
                min_units: minU,
                max_units: maxU,
                company_id: service.company_id || order.company_id,
                status: 'pending' // Resets newly added services to pending
            }, { transaction });

            if (service.additions && service.additions.length > 0) {
                const additionsData = service.additions.map(add => {
                    const aUnitPrice = Number(add.price_per_unit) || 0;
                    const aMinU = Number(add.min_units) || 0;
                    const aMaxU = Number(add.max_units) || aMinU;
                    const aFixed = Number(add.fixed_price) || 0;

                    let aMin = aUnitPrice * aMinU;
                    let aMax = aUnitPrice * aMaxU;

                    if (add.pricing_type === 'flat_rate') {
                        aMin = aFixed; aMax = aFixed;
                    }

                    sMin += aMin;
                    sMax += aMax;

                    return {
                        order_service_id: createdService.id,
                        addition_id: add.addition_id,
                        pricing_type: add.pricing_type,
                        price_per_unit: aUnitPrice,
                        fixed_price: aFixed,
                        min_units: aMinU,
                        max_units: aMaxU,
                        min_total_price: aMin,
                        max_total_price: aMax,
                        total_price: aMax,
                        note: add.note
                    };
                });
                await OrderServiceAddition.bulkCreate(additionsData, { transaction });
            }

            // Sync service price range
            await createdService.update({ 
                min_total_price: sMin, 
                max_total_price: sMax,
                total_price: sMax 
            }, { transaction });

            orderMinPrice += sMin;
            orderMaxPrice += sMax;
        }

        // Apply price range to master order
        order.min_total_price = orderMinPrice;
        order.max_total_price = orderMaxPrice;
        order.total_price = orderMaxPrice; 
    }

    // Save final changes to the order record (Status remains unchanged)
    await order.save({ transaction });

    // Reload with all relations for the response
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
        transaction
    });

    return order.toJSON();
};