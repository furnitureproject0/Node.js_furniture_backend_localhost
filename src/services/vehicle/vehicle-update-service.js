'use strict';

// services/vehicleService.js
import { Vehicle, Company } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Update an existing vehicle
 * @param {Object} data - Vehicle data from request body
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Updated vehicle
 */
export const updateVehicle = async (id, data, options = {}) => {

    const { transaction } = options;

    const vehicle = await Vehicle.findByPk(id, {
        ...(transaction && { transaction }),
    });
    if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
    }

    if (data.license_plate && data.license_plate !== vehicle.license_plate) {
        const existingVehicle = await Vehicle.findOne({
            where: { license_plate: data.license_plate },
            ...(transaction && { transaction }),
        });
        if (existingVehicle) {
            throw new AppError('License plate already exists', 409);
        }
    }

    if (data.company_id) {
        const companyExists = await Company.findByPk(data.company_id, {
            ...(transaction && { transaction }),
        });
        if (!companyExists) {
            throw new AppError('Company not found', 404);
        }
    }

    await vehicle.update(data, {
        ...(transaction && { transaction })
    });
    
    return vehicle.toJSON();
}