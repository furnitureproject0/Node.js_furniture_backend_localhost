'use strict';

import { Addition, Service, ServiceAddition } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { validateAdditions } from './helper-validate-addition.js';

/**
 * Update an existing service
 * @param {string} id - Service ID
 * @param {Object} data - Service data from request body
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Updated service
 */
export const updateService = async (id, data, options = {}) => {

    const { transaction } = options;

    const service = await Service.findByPk(id, {
        ...(transaction && { transaction }),
    });
    if (!service) {
        throw new AppError('Service not found', 404);
    }

    if (data.name && data.name !== service.name) {
        const existingService = await Service.findOne({
            where: { name: data.name },
            ...(transaction && { transaction }),
        });
        if (existingService) {
            throw new AppError('Service name already exists', 409);
        }
    }

    if (data.additions && Array.isArray(data.additions) && data.additions.length > 0) {
        await validateAdditions(data.additions, { transaction });
    }

    const allowedFields = [
        'name', 
        'description', 
        'pricing_type', 
        'is_active', 
        'price_per_unit', 
        'min_units', 
        'max_units', 
        'minimum_charge', 
        'discount', 
        'requirements'
    ];

    const updateData = {};

    Object.keys(data).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = data[key];
        }
    });

    await service.update(updateData, {
        ...(transaction && { transaction })
    });

    if (data.additions && Array.isArray(data.additions) && data.additions.length > 0) {
        await ServiceAddition.destroy({
            where: { service_id: id },
            ...(transaction && { transaction })
        });
        const serviceAdditions = data.additions.map((additionId) => ({
            service_id: id,
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
}