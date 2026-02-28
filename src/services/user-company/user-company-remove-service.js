'use strict';

import { UserCompany, User } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Remove a specific company assignment from an admin user
 * @param {number} userId - The ID of the admin user
 * @param {number} companyId - The ID of the company
 * @param {string} type - The type of assignment ('internal' or 'external')
 * @param {Object} options - Database transaction options
 * @returns {boolean} True if deleted successfully
 */
export const removeCompanyFromUserService = async (userId, companyId, type, options = {}) => {
    const { transaction } = options;

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const deletedCount = await UserCompany.destroy({
        where: {
            user_id: userId,
            company_id: companyId,
            type: type
        },
        transaction
    });

    if (deletedCount === 0) {
        throw new AppError('This company assignment does not exist for this user', 404);
    }

    return true;
};