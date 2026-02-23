'use strict';

import { Service } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Activate a service by ID (set is_active to true)
 * @param {string} id - Service ID
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Activated service info
 */
export const activateService = async (id, options = {}) => {
    
    const { transaction } = options;

    const service = await Service.findOne({
        where: {
            id: id,
            is_active: false,
            is_deleted: false
        },
        ...(transaction && { transaction }),
    });
    if (!service) {
        throw new AppError('Service not found or already active', 404);
    }

    await service.update({ is_active: true }, {
        ...(transaction && { transaction }),
    });

    return {
        message: 'Service activated successfully',
        service_id: id
    }
}

/**
 * Deactivate a service by ID (set is_active to false)
 * @param {string} id - Service ID
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Deactivated service info
 */
export const deactivateService = async (id, options = {}) => {
    
    const { transaction } = options;

    const service = await Service.findOne({
        where: {
            id: id,
            is_active: true,
            is_deleted: false
        },
        ...(transaction && { transaction }),
    });
    if (!service) {
        throw new AppError('Service not found or already inactive', 404);
    }

    await service.update({ is_active: false }, {
        ...(transaction && { transaction }),
    });

    return {
        message: 'Service deactivated successfully',
        service_id: id
    }
}