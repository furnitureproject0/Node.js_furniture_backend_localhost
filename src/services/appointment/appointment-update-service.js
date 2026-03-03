'use strict';

import { Appointment, Company, User, Order } from '../../models/index.js'; 
import AppError from '../../utils/AppError.js';

/**
 * Update an existing appointment
 * @param {number|string} id - Appointment ID
 * @param {Object} data - Update data
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Updated appointment
 */
export const updateAppointmentService = async (id, data, options = {}) => {
    const { transaction } = options;

    const appointment = await Appointment.findByPk(id, {
        ...(transaction && { transaction })
    });

    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    if (data.company_id) {
        const companyExists = await Company.findByPk(data.company_id, { transaction });
        if (!companyExists) {
            throw new AppError('Company with the specified company_id does not exist', 404);
        }
    }

    if (data.client_id) {
        const clientExists = await User.findByPk(data.client_id, { transaction });
        if (!clientExists) {
            throw new AppError('Client with the specified client_id does not exist', 404);
        }
    }

    if (data.order_id) {
        const orderExists = await Order.findByPk(data.order_id, { transaction });
        if (!orderExists) {
            throw new AppError('Order with the specified order_id does not exist', 404);
        }
    }

    if (data.status && !['pending', 'confirmed', 'completed', 'cancelled'].includes(data.status)) {
        throw new AppError('Invalid status value. Allowed values are: pending, confirmed, completed, cancelled', 400);
    }

    const allowedFields = [
        'company_id', 
        'client_id', 
        'order_id', 
        'expected_date', 
        'expected_time', 
        'notes', 
        'status'
    ];

    const updateData = {};
    Object.keys(data).forEach(key => {
        if (allowedFields.includes(key) && data[key] !== undefined) {
            updateData[key] = data[key];
        }
    });

    await appointment.update(updateData, {
        ...(transaction && { transaction })
    });

    await appointment.reload({
        include: [
            { model: Company, as: 'company', attributes: ['id', 'name'] },
            { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
            { model: Order, as: 'order', attributes: ['id', 'status'] }
        ],
        ...(transaction && { transaction })
    });

    return appointment.toJSON();
};