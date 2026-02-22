'use strict';

import { Service } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Create a new service
 * @param {Object} data - Service data from request body
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Created service
 */
export const createService = async (data, options = {}) => {

    const { transaction } = options;

    if (!data.name) {
        throw new AppError('Service name is required', 400);
    }

    const existingService = await Service.findOne({
        where: { name: data.name },
        ...(transaction && { transaction }),
    });
    if (existingService) {
        throw new AppError('Service name already exists', 409);
    }

    if (!data.requirements) {
        throw new AppError('Service requirements are required', 400);
    }

    const serviceData = {
        name: data.name,
        description: data.description || null,
        requirements: data.requirements,
        pricing_type: data.pricing_type || null,
        price_per_unit: data.price_per_unit || null,
        min_units: data.min_units || null,
        max_units: data.max_units || null,
        minimum_charge: data.minimum_charge || null,
        discount: data.discount || null,
        is_active: data.is_active ?? true,
    }

    const service = await Service.create(serviceData, { 
        ...(transaction && { transaction })
    });

    return service.toJSON();
};