'use strict';

import { Company } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Get company by filters
 * @param {Object} filters - Sequelize where filters (e.g., { email, role, id })
 * @param {Object} options - Additional sequelize options (include, transaction, attributes, etc.)
 * @returns {Object} company instance
 */
export const getCompany = async (filters = {}, options = {}) => {

    if (!filters || Object.keys(filters).length === 0) {
        throw new AppError('Filters are required to find company', 400);
    }

    console.log('Getting company with filters:', filters);

    const company = await Company.findOne({
        where: filters,
        ...options
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    return company.toJSON();
};