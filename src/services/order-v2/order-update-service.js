'use strict';

import { Order, OrderService, OrderServiceAddition, Vehicle, OrderVehicle, Location } from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { getOrCreateLocation } from '../location/index.js';
import { getCompany } from '../company/index.js';
import { validateAndGetVehicles, validateServicesAndAdditions } from '../helpers/order-helpers.js';

/**
 * Update an existing order
 * @param {number} orderId - ID of the order to update
 * @param {Object} orderData - Updated order data from request body
 * @param {Object} options - Additional options (e.g., userId, transaction)
 * @returns {Object} Updated order
 */
export const updateOrderService = async (orderId, orderData = {}, options = {}) => {
    const transaction = options.transaction || options;

    const order = await Order.findByPk(orderId, { transaction });
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (order.status !== 'pending') {
        throw new AppError('Only pending orders can be updated', 400);
    }

    const {
        execution_date,
        execution_time,
        notes,
        services,
        primary_location,
        secondary_location,
        vehicles,
        client_id,
        company_id
    } = orderData;

    let orderTotalPrice = 0;

    if (client_id) {
        order.client_id = client_id;
    }

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

    if (vehicles && vehicles.length > 0) {
        const validVehicles = await validateAndGetVehicles(vehicles, transaction);
        await OrderVehicle.destroy({ where: { order_id: orderId }, transaction });
        const orderVehiclesData = validVehicles.map(v => ({ order_id: orderId, vehicle_id: v.id }));
        await OrderVehicle.bulkCreate(orderVehiclesData, { transaction });
    }

    if (services && services.length > 0) {
        await validateServicesAndAdditions(services, transaction);
        const oldServiceIds = await OrderService.findAll({
            where: { order_id: orderId },
            attributes: ['id'],
            transaction
        }).then(res => res.map(s => s.id));

        await OrderServiceAddition.destroy({ where: { order_service_id: oldServiceIds }, transaction });
        await OrderService.destroy({ where: { order_id: orderId }, transaction });

        for (const service of services) {
            let serviceTotalPrice = Number(service.total_price) || 0;

            const createdService = await OrderService.create({
                order_id: orderId,
                service_id: service.service_id,
                total_price: serviceTotalPrice,
                company_id: service.company_id || order.company_id,
                notes: service.notes || null,
                primary_location_id: service.primary_location_id || order.primary_location_id,
                secondary_location_id: service.secondary_location_id || order.secondary_location_id,
                preferred_date: service.preferred_date || order.execution_date,
                preferred_time: service.preferred_time || order.execution_time,
                pricing_type: service.pricing_type || 'per_hour',
            }, { transaction });

            if (service.additions && service.additions.length > 0) {
                const additionsData = service.additions.map(add => ({
                    order_service_id: createdService.id,
                    addition_id: add.addition_id,
                    total_price: Number(add.total_price) || 0
                }));
                serviceTotalPrice += additionsData.reduce((sum, add) => sum + add.total_price, 0);
                await OrderServiceAddition.bulkCreate(additionsData, { transaction });
            }

            await createdService.update({ total_price: serviceTotalPrice }, { transaction });
            orderTotalPrice += serviceTotalPrice;
        }
        order.total_price = orderTotalPrice;
    }

    await order.save({ transaction });

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

    return order.toJSON();
};