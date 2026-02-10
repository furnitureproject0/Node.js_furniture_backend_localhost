import { Service, ServiceAddition, Offer, OrderService } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

const CUSTOM_ADDITION_ID = 1;

/**
 * Validates services array and their additions
 * @param {Array} services - Array of service objects with service_id and additions [
 *  {
 *      "service_id": 1,
 *      "additions": [
 *          {
 *              "addition_id": 1,
 *              "note": "string"
 *          }
 *      ]
 *  }
 * ]
 * @throws {AppError} If validation fails
 */
export const validateServicesAndAdditions = async (services) => {
    if (!services || !Array.isArray(services) || services.length === 0) {
        throw new AppError('Services array is required and cannot be empty', 400);
    }

    const serviceIds = services.map(s => s.service_id);
    if (serviceIds.some(id => !id || typeof id !== 'number')) {
        throw new AppError('All service IDs must be valid numbers', 400);
    }

    // Validate all service IDs exist
    const validServices = await Service.findAll({
        where: { id: serviceIds },
        attributes: ['id']
    });

    if (validServices.length !== serviceIds.length) {
        const foundIds = validServices.map(s => s.id);
        const invalidIds = serviceIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Invalid service IDs: ${invalidIds.join(', ')}`, 400);
    }

    // Validate additions for each service
    for (const { service_id, additions } of services) {
        if (!additions?.length) continue;

        // Validate addition objects structure
        const invalidStructure = additions.some(add => !add.addition_id || typeof add.addition_id !== 'number');
        if (invalidStructure) {
            throw new AppError(`Invalid addition structure for service ${service_id}. Each addition must have an addition_id`, 400);
        }

        const additionIds = additions.map(add => add.addition_id);

        // Get valid service-addition relationships
        const validLinks = await ServiceAddition.findAll({
            where: {
                serviceId: service_id
            },
            attributes: ['additionId']
        });

        const validAdditionIds = validLinks.map(link => link.additionId);

        // Check each addition, excluding custom additions (ID: 1)
        const invalidAdditions = additionIds.filter(id => {
            // Custom additions are always allowed
            if (id === CUSTOM_ADDITION_ID) return false;
            // Check if the addition is valid for this service
            return !validAdditionIds.includes(id);
        });

        if (invalidAdditions.length > 0) {
            throw new AppError(
                `Invalid additions [${invalidAdditions.join(', ')}] for service ${service_id}. These additions are not available for this service.`,
                400
            );
        }

        // Validate that custom additions have notes
        const customAdditions = additions.filter(add => add.addition_id === CUSTOM_ADDITION_ID);
        const customAdditionsWithoutNotes = customAdditions.some(add => !add.note);
        if (customAdditionsWithoutNotes) {
            throw new AppError(
                `Custom additions for service ${service_id} must include a note`,
                400
            );
        }
    }
};

/**
 * Validates that the user owns the order
 * @param {Object} order - Order instance
 * @param {number} userId - User ID to check
 * @throws {AppError} If user doesn't own the order
 */
export const validateOrderOwnership = (order, userId) => {
    if (order.client_id !== userId) {
        throw new AppError('Not authorized to update this order', 403);
    }
};

/**
 * Checks if order can be updated (no pending or accepted offers)
 * @param {number} orderId - Order ID to check
 * @throws {AppError} If order cannot be updated
 */
export const validateOrderCanBeUpdated = async (orderId) => {
    const offers = await Offer.findAll({
        include: [
            {
                model: OrderService,
                as: 'orderService',
                where: { order_id: orderId },
                attributes: []
            }
        ],
        where: {
            status: ['pending', 'accepted']
        }
    });

    if (offers.length > 0) {
        throw new AppError(
            'Order cannot be updated because it has pending or accepted offers',
            400
        );
    }
};
