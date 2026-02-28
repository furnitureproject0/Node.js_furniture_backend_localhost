'use strict';

import { User } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Get user by filters
 * @param {Object} filters - Sequelize where filters (e.g., { email, role, id })
 * @param {Object} options - Additional sequelize options (include, transaction, attributes, etc.)
 * @returns {Object} user instance
 */
export const getUser = async (filters = {}, options = {}) => {

    if (!filters || Object.keys(filters).length === 0) {
        throw new AppError('Filters are required to find user', 400);
    }

    console.log('Getting user with filters:', filters);

    const user = await User.findOne({
        where: filters,
        ...options
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user.toJSON();
};