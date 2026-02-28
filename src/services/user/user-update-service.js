'use strict';

import { User, Phone, Location } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';

/**
 * Generic service to update any type of user
 * @param {number} userId - ID of the user to update
 * @param {Object} updateData - Data to update
 * @param {Object} options - Options including transaction
 * @returns {Object} Updated user object
 */
export const updateUserService = async (userId, updateData, options = {}) => {
    const { transaction } = options;

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const { email, phones, location, ...restData } = updateData;

    if (email && email !== user.email) {
        const emailExists = await User.findOne({
            where: { email },
            transaction
        });
        if (emailExists) {
            throw new AppError('Email already in use by another user', 409);
        }
        restData.email = email;
    }

    if (phones) {
        const existingPhones = await Phone.findAll({
            where: {
                phone: { [Op.in]: phones },
                owner_id: { [Op.ne]: userId },
                owner_type: 'User'
            },
            transaction
        });

        if (existingPhones.length > 0) {
            const duplicates = existingPhones.map(p => p.phone).join(', ');
            throw new AppError(`The following phone numbers are already in use by another user: ${duplicates}`, 409);
        }

        await Phone.destroy({
            where: { owner_id: userId, owner_type: 'User' },
            transaction
        });

        if (phones.length > 0) {
            const phonesToCreate = phones.map(phone => ({
                phone,
                owner_id: userId,
                owner_type: 'User'
            }));
            await Phone.bulkCreate(phonesToCreate, { transaction });
        }
    }

    if (location) {
        if (user.location_id) {
            await Location.update(location, {
                where: { id: user.location_id },
                transaction
            });
        } else {
            const newLocation = await Location.create(location, { transaction });
            restData.location_id = newLocation.id;
        }
    }

    await user.update(restData, { transaction });

    return { updatedUser: user };
};