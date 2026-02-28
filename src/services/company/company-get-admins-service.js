import { UserCompany } from '../../models/index.js';

/**
 * Get unique admin user IDs for an array of company IDs
 * @param {Array<number>} companyIds 
 * @param {Object} options (e.g., transaction)
 * @returns {Array<number>} Array of unique user IDs
 */
export const getCompanyAdmins = async (companyIds, options = {}) => {

    const transaction = options.transaction;

    if (!companyIds || companyIds.length === 0) return [];

    const companyAdmins = await UserCompany.findAll({
        where: { company_id: companyIds },
        attributes: ['user_id'],
        ...(transaction && { transaction }),
    });

    return [...new Set(companyAdmins.map(admin => admin.user_id))];
};