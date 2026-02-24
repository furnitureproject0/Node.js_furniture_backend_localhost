'use strict';

import { describe } from "node:test";
import { Addition } from "../../models/index";
import AppError from '../../utils/AppError.js';

/**
 * Create a new Addition
 * @param {Object} data - Addition data
 * @param {string} data.name - Name of the addition
 * @param {number} data.price - Price of the addition
 * @param {boolean} [data.is_active=true] - Whether the addition is active
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Created addition
 */
export const createAddition = async (data, options = {}) => {

    const { transaction } = options;


    if (!data.name || typeof data.name !== 'string') {
        throw new AppError('Addition name is required and must be a string', 400);
    }

    const existingAddition = await Addition.findOne({
        where: { name: data.name },
        ...(transaction && { transaction }),
    });
    if (existingAddition) {
        throw new AppError('Addition name already exists', 409);
    }

    const additionData = {
        name: data.name,
        description: data.description || null,
        discount: data.discount || 0,
        pricing_type: data.pricing_type || null,
        price_per_unit: data.price_per_unit || null,
        min_units: data.min_units || null,
        max_units: data.max_units || null,
        minimum_charge: data.minimum_charge || null,
        requirements: data.requirements || null,
        is_active: data.is_active ?? true,
        is_deleted: false
    };

    const addition = await Addition.create(additionData, {
        ...(transaction && { transaction }),
    });

    return addition.toJSON();
}
