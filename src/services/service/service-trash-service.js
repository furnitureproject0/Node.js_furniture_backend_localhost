'use strict';

import { Service } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Soft delete a service by ID (set is_deleted to true)
 * @param {string} id - Service ID
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Soft deleted service info
 */
export const softDeleteService = async (id, options = {}) => {
    
    const { transaction } = options;

    const service = await Service.findOne({
        where: {
            id: id,
            is_deleted: false
        },
        ...(transaction && { transaction }),
    });
    if (!service) {
        throw new AppError('Service not found', 404);
    }

    await service.update({ is_deleted: true }, {
        ...(transaction && { transaction }),
    });

    return {
        message: 'Service trashed successfully',
        service_id: id
    }
}