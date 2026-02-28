'use strict';

import { User, Phone, Location } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Generic service to delete a user and clean up their associated data
 * @param {number} userId - ID of the user to delete
 * @param {Object} options - Options including database transaction
 * @returns {boolean} True if deletion is successful
 */
export const deleteUserService = async (userId, options = {}) => {
    const { transaction } = options;

    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const locationId = user.location_id;

    await Phone.destroy({
        where: { 
            owner_id: userId, 
            owner_type: 'User' 
        },
        transaction
    });

    await user.destroy({ transaction });

    if (locationId) {
        await Location.destroy({
            where: { id: locationId },
            transaction
        });
    }

    return true;
};