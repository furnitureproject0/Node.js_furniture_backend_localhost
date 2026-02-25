'use strict';

import { Service, Addition } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Retrieve trashed service by ID
 * @param {string} id - Service ID
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Trashed service
 */
export const retrieveTrashedService = async (id, options = {}) => {
    
    const { transaction } = options;

    const service = await Service.findOne({
        where: {
            id: id,
            is_deleted: true
        },
        ...(transaction && { transaction }),
    });
    if (!service) {
        throw new AppError('Trashed service not found', 404);
    }

    await service.update({ is_deleted: false }, {
        ...(transaction && { transaction }),
    });

    await service.reload({
        include: [{
            model: Addition,
            as: 'additions',
            where: {
                is_deleted: false,
                is_active: true
            },
            through: { attributes: [] }
        }],
        ...(transaction && { transaction })
    });

    return service.toJSON();
}