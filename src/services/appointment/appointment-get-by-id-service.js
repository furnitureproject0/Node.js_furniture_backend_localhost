'use strict';

import { Appointment, Company, User, Order } from '../../models/index.js'; 
import AppError from '../../utils/AppError.js';

/**
 * Get appointment by ID
 * @param {number|string} id - Appointment ID
 * @param {Object} options - Additional options
 * @returns {Object} Appointment data
 */
export const getAppointmentByIdService = async (id, options = {}) => {
    const { transaction } = options;

    const appointment = await Appointment.findByPk(id, {
        include: [
            { model: Company, as: 'company', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
            { model: Order, as: 'order', attributes: ['id', 'status'] }
        ],
        ...(transaction && { transaction })
    });

    if (!appointment) {
        throw new AppError('Appointment not found', 404);
    }

    return appointment.toJSON();
};