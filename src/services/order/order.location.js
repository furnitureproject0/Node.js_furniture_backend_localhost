import { Location } from '../../models/index.js';

/**
 * Creates pickup and optional destination locations for an order
 * @param {Object} params
 * @param {Object} params.location - Pickup location data
 * @param {Object} params.destination_location - Optional destination location data
 * @param {Object} params.transaction - Sequelize transaction
 * @returns {Object} { pickupLocationId, destinationLocationId }
 */
export const createOrderLocations = async ({ location, destination_location, transaction }) => {
    const pickupLocation = await Location.create(location, { transaction });

    let destinationLocationId = null;
    if (destination_location) {
        const destinationLocation = await Location.create(destination_location, { transaction });
        destinationLocationId = destinationLocation.id;
    }

    return {
        pickupLocationId: pickupLocation.id,
        destinationLocationId
    };
};

/**
 * Updates existing order locations or creates/deletes as needed
 * @param {Object} params
 * @param {Object} params.order - Order instance with loaded locations
 * @param {Object} params.location - Updated pickup location data (optional)
 * @param {Object} params.destination_location - Updated destination location data (optional, null to delete)
 * @param {Object} params.transaction - Sequelize transaction
 * @returns {Object} { destination_location_id } - Updated destination location ID if changed
 */
export const updateOrderLocations = async ({ order, location, destination_location, transaction }) => {
    const updates = {};

    // Update pickup location if provided
    if (location) {
        await order.location.update(location, { transaction });
    }

    // Handle destination location updates
    if (destination_location && order.destinationLocation) {
        // Update existing destination location
        await order.destinationLocation.update(destination_location, { transaction });
    } else if (destination_location && !order.destinationLocation) {
        // Create new destination location
        const newDestination = await Location.create(destination_location, { transaction });
        updates.destination_location_id = newDestination.id;
    } else if (destination_location === null && order.destinationLocation) {
        // Delete destination location
        await order.destinationLocation.destroy({ transaction });
        updates.destination_location_id = null;
    }

    return updates;
};
