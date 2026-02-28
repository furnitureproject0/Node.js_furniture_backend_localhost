'use strict';

import { Company, User, UserCompany } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Get companies assigned to an admin user (optionally filtered by type)
 * @param {number} userId - The ID of the admin user
 * @param {Object} filters - Optional filters { type }
 * @param {Object} pagination - Pagination options { page, limit }
 * @param {Object} options - Database transaction options
 * @returns {Object} { companies: [], pagination }
 */
export const getAdminCompaniesService = async (userId, filters = {}, pagination = {}, options = {}) => {
    const { transaction } = options;
    const { type } = filters;

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const whereClause = { user_id: userId };
    
    if (type) {
        whereClause.type = type; 
    }

    const { count, rows: assignments } = await UserCompany.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        transaction
    });

    const paginationMetadata = {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
    };

    if (assignments.length === 0) {
        return { companies: [], pagination: paginationMetadata };
    }

    const companyIds = [...new Set(assignments.map(a => a.company_id))];
    const companies = await Company.findAll({
        where: { id: companyIds },
        transaction
    });

    const formattedCompanies = assignments.map(assignment => {
        const companyInfo = companies.find(c => c.id === assignment.company_id);
        return {
            id: companyInfo.id,
            name: companyInfo.name,
            email: companyInfo.email,
            assigned_at: assignment.createdAt,
            type: assignment.type 
        };
    });

    return {
        companies: formattedCompanies,
        pagination: paginationMetadata
    };
};