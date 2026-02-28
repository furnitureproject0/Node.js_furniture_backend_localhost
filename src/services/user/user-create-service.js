'use strict';

import { User, Phone, Location } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';

/**
 * Generic service to create any type of user (client, admin, driver, worker, etc.)
 * @param {Object} userData - The user data payload
 * @param {Object} options - Options including the database transaction
 * @returns {Object} Object containing the created user and the notification record
 */
export const createUserService = async (userData, options = {}) => {
    const { transaction } = options;

    const { 
        name, 
        email, 
        password,
        birthdate, 
        role = 'client', 
        company_id,
        location,
        phones = [], 
    } = userData;

    const userExists = await User.findOne({
        where: { email: email },
        transaction
    });

    if (userExists) {
        throw new AppError('Email already in use', 409);
    }

    if (phones && phones.length > 0) {
        const existingPhones = await Phone.findAll({
            where: {
                phone: { [Op.in]: phones },
                owner_type: 'User'
            },
            transaction
        });

        if (existingPhones.length > 0) {
            const duplicates = existingPhones.map(p => p.phone).join(', ');
            throw new AppError(`The following phone numbers are already in use: ${duplicates}`, 409);
        }
    }

    let locationId = null;
    if (location) {
        const newLocation = await Location.create(location, { transaction });
        locationId = newLocation.id;
    }

    const newUser = await User.create({
        name,
        email,
        password,
        birthdate,
        role,
        company_id,
        location_id: locationId
    }, { transaction });

    if (phones && phones.length > 0) {
        const phonesToCreate = phones.map(phone => ({
            phone,
            owner_id: newUser.id,
            owner_type: 'User'
        }));
        await Phone.bulkCreate(phonesToCreate, { transaction });
    }

    return { newUser };
};