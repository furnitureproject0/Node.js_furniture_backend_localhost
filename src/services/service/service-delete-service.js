'use strict';

import { Service } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Delete a service by ID
 * @param {string} id - Service ID
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Deleted service
 */
export const deleteService = async (id, options = {}) => {

    const { transaction } = options;

    const service = await Service.findByPk(id, {
        ...(transaction && { transaction }),
    });
    if (!service) {
        throw new AppError('Service not found', 404);
    }

    await service.destroy({
        ...(transaction && { transaction }),
    });

    return {
        message: 'Service deleted successfully',
        service_id: id
    }
}