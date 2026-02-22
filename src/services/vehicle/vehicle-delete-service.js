'use strict';

// services/vehicleService.js
import { Vehicle } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Delete an existing vehicle
 * @param {string} id - Vehicle ID
 * @param {Object} user - User object (for authorization checks)
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} deleted vehicle data
 */
export const deleteVehicle = async (id, user, options = {}) => {

    const { transaction } = options;

    const vehicle = await Vehicle.findByPk(id, {
        ...(transaction && { transaction }),
    });
    if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
    }

    if (user.role === 'company_admin' && vehicle.company_id !== user.company_id) {
        throw new AppError('Unauthorized to delete this vehicle', 403);
    }

    await vehicle.destroy({
        ...(transaction && { transaction })
    });
    
    return { 
        message: 'Vehicle deleted successfully',
        vehicle_id: id
     };
}