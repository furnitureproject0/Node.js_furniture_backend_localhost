'use strict';

import { Addition } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';

/**
 * Validate that all provided addition IDs exist and are valid
 * @param {Array} additionIds - Array of addition IDs to validate
 * @returns {boolean} True if all additions are valid, otherwise throws an error
 */

export const validateAdditions = async (additionIds = [], options = {}) => {

    const { transaction } = options;

    if (!additionIds.length) return true;

    const normalizedIds = additionIds.map(id => Number(id));

    const additions = await Addition.findAll({
        where: { 
            id: { [Op.in]: normalizedIds },
            is_deleted: false,
            is_active: true
        },
        ...(transaction && { transaction }),
    });

    if (additions.length !== normalizedIds.length) {
        const foundIds = additions.map(a => a.id);
        const invalidIds = normalizedIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Invalid addition IDs: ${invalidIds.join(', ')}`, 400);
    }

    return true;
};