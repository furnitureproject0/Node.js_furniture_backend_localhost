'use strict';

import { Service, ServiceAddition, Addition } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { validateAdditions } from './helper-validate-addition.js';

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

    if (data.additions && Array.isArray(data.additions) && data.additions.length > 0) {
        await validateAdditions(data.additions, { transaction });
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
        is_deleted: false
    }

    const service = await Service.create(serviceData, { 
        ...(transaction && { transaction })
    });

    if (data.additions && Array.isArray(data.additions) && data.additions.length > 0) {
        const serviceAdditions = data.additions.map((additionId) => ({
            service_id: service.id,
            addition_id: additionId
        }));
        await ServiceAddition.bulkCreate(serviceAdditions, {
            ...(transaction && { transaction })
        });
    }

    await service.reload({
        include: [{
            model: Addition,
            as: 'additions',
            through: { attributes: [] }
        }],
        ...(transaction && { transaction })
    });

    return service.toJSON();
};