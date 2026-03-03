'use strict';

import { Appointment, Company, User, Order } from '../../models/index.js'; // تأكد من مسار الـ index
import AppError from '../../utils/AppError.js';

/**
 * Create a new appointment
 * @param {Object} data - Appointment data from request body
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Created appointment
 */
export const createAppointmentService = async (data, options = {}) => {
    const { transaction } = options;

    if (!data.company_id || !data.client_id || !data.expected_date || !data.expected_time) {
        throw new AppError('company_id, client_id, expected_date, and expected_time are required', 400);
    }

    if(data.company_id) {
        const companyExists = await Company.findByPk(data.company_id, { transaction });
        if (!companyExists) {
            throw new AppError('Company with the specified company_id does not exist', 404);
        }
    }

    if(data.client_id) {
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

    const appointmentData = {
        company_id: data.company_id,
        client_id: data.client_id,
        order_id: data.order_id || null,
        expected_date: data.expected_date,
        expected_time: data.expected_time,
        notes: data.notes || null,
        status: data.status || 'pending'
    };

    const appointment = await Appointment.create(appointmentData, { 
        ...(transaction && { transaction }) 
    });

    // Reload with associations
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