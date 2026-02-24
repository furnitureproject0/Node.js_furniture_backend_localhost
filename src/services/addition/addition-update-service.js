'use strict';

import { Addition } from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { Op } from "sequelize";

/**
 * Update an addition by ID
 * @param {string} id - Addition ID
 * @param {Object} data - Data to update
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Updated addition
 */
export const updateAddition = async (id, data, options = {}) => {

    const { transaction } = options;

    const addition = await Addition.findByPk(id, {
        ...(transaction && { transaction }),
    });
    if (!addition) {
        throw new AppError('Addition not found', 404);
    }

    if (data.name && data.name !== addition.name) {
        const existingAddition = await Addition.findOne({
            where: {
                name: data.name,
                id: { [Op.ne]: id },
            },
            ...(transaction && { transaction }),
        });
        if (existingAddition) {
            throw new AppError('Addition name already exists', 409);
        }
    }

    const updatedData = {
        name: data.name || addition.name,
        description: data.description !== undefined ? data.description : addition.description,
        discount: data.discount !== undefined ? data.discount : addition.discount,
        pricing_type: data.pricing_type !== undefined ? data.pricing_type : addition.pricing_type,
        price_per_unit: data.price_per_unit !== undefined ? data.price_per_unit : addition.price_per_unit,
        min_units: data.min_units !== undefined ? data.min_units : addition.min_units,
        max_units: data.max_units !== undefined ? data.max_units : addition.max_units,
        minimum_charge: data.minimum_charge !== undefined ? data.minimum_charge : addition.minimum_charge,
        requirements: data.requirements !== undefined ? data.requirements : addition.requirements,
        is_active: data.is_active !== undefined ? data.is_active : addition.is_active,
        is_deleted: data.is_deleted !== undefined ? data.is_deleted : addition.is_deleted
    };

    await addition.update(updatedData, {
        ...(transaction && { transaction }),
    });

    await addition.reload({
        ...(transaction && { transaction }),
    });

    return addition.toJSON();
}