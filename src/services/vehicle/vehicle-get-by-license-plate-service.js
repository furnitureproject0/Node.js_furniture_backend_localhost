'use strict';

import { Vehicle } from '../../models/index.js';
import { Op } from 'sequelize';
import AppError from '../../utils/AppError.js';

/**
 * Get vehicle by license plate
 * @param {string} licensePlate - License plate of the vehicle
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Vehicle instance
 */
export const getVehicleByLicensePlate = async (licensePlate, options = {}) => {

    const { transaction } = options;

    if (!licensePlate || licensePlate.trim() === '') {
        throw new AppError('License plate is required', 400);
    }

    const vehicle = await Vehicle.findOne({
        where: {
            license_plate: licensePlate.trim()
        },
        ...options
    });

    if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
    }

    return vehicle.toJSON();
};