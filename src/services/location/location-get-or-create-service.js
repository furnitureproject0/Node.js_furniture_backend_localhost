'use strict';

import { Location } from '../../models/index.js';

/**
 * Finds a location by address, or creates it if not exists.
 * @param {Object} locationData - The location data object
 * @param {string} locationData.address - Required
 * @param {string} [locationData.type]
 * @param {number} [locationData.floor]
 * @param {number} [locationData.area]
 * @param {number} [locationData.number_of_floors]
 * @param {boolean} [locationData.has_elevator]
 * @param {number} [locationData.latitude]
 * @param {number} [locationData.longitude]
 * @param {string} [locationData.notes]
 * @param {Object} [locationData.qualities]
 * @returns {Promise<Location>} - Returns the found or created Location instance
 */
export const getOrCreateLocation = async (locationData, options = {}) => {

    const { transaction } = options;
    if (!locationData.address) {
        throw new Error('Address is required');
    }

    const [location, created] = await Location.findOrCreate({
        where: { address: locationData.address },
        defaults: {
        type: locationData.type || null,
        floor: locationData.floor || null,
        area: locationData.area || null,
        number_of_floors: locationData.number_of_floors || null,
        // uncomment if you add has_elevator to model
        // has_elevator: locationData.has_elevator || false,
        lat: locationData.latitude || null,
        lon: locationData.longitude || null,
        notes: locationData.notes || null,
        qualities: locationData.qualities || {}
        },
        ...(transaction && { transaction })
    });

    return location;
};