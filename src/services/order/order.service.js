import { Location, Order, OrderService as OrderServiceModel, OrderTimeline, Service } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { validateServicesAndAdditions, validateOrderOwnership, validateOrderCanBeUpdated } from './order.validation.js';
import { createOrderLocations, updateOrderLocations } from './order.location.js';
import { createOrderServicesAndAdditions, replaceOrderServices } from './order.lifecycle.js';
import { saveAndAttachOrderImages } from './order.image.js';
import { commonFilterSchema } from '../../validation/global-schemas.js';
import { getOrderInclude, getOrderListInclude, getOrderAttributes } from './order.queries.js';


/**
 * Creates a new order with all related entities
 * @param {Object} params
 * @param {number} params.clientId - Client user ID
 * @param {Array} params.services - Array of services with additions
 * @param {Object} params.location - Pickup location data
 * @param {Object} params.destination_location - Optional destination location data
 * @param {Object} params.orderData - Additional order data
 * @param {Array} params.files - Optional uploaded files
 * @param {Object} params.options - Optional configuration
 * @param {string} params.options.timelineMessage - Custom timeline message (default: 'Order created successfully')
 * @param {string} params.options.timelineStatus - Custom timeline status (default: 'pending')
 * @returns {Object} Created order with all relations
 */
export const createOrder = async ({
    clientId,
    services,
    location,
    destination_location,
    orderData,
    files,
    options = {}
}) => {
    const {
        timelineMessage = 'Order created successfully',
        timelineStatus = 'pending'
    } = options;

    const order = await sequelize.transaction(async (t) => {
        // Validate services
        await validateServicesAndAdditions(services);

        // Create locations
        const { pickupLocationId, destinationLocationId } = await createOrderLocations({
            location,
            destination_location,
            transaction: t
        });

        // Create order
        const newOrder = await Order.create({
            ...orderData,
            client_id: clientId,
            location_id: pickupLocationId,
            destination_location_id: destinationLocationId
        }, { transaction: t });

        // Create order services and their additions
        await createOrderServicesAndAdditions({
            orderId: newOrder.id,
            services,
            transaction: t
        });

        // Create initial timeline entry
        await OrderTimeline.create({
            order_id: newOrder.id,
            status: timelineStatus,
            message: timelineMessage
        }, { transaction: t });

        // Return order ID to fetch outside transaction
        return newOrder;
    });

    // Handle image uploads outside transaction
    if (files && files.length > 0) {
        const imageFilenames = await saveAndAttachOrderImages({ order, files });
        if (imageFilenames) {
            order.images = imageFilenames;
        }
    }

    return order;
};

/**
 * Updates an existing order
 * @param {Object} params
 * @param {number} params.orderId - Order ID to update
 * @param {number} params.userId - User ID performing the update (for ownership validation)
 * @param {Array} params.services - Optional updated services array
 * @param {Object} params.location - Optional updated pickup location
 * @param {Object} params.destination_location - Optional updated destination location
 * @param {Object} params.orderData - Additional order data to update
 * @param {Array} params.files - Optional uploaded files
 * @param {Object} params.options - Optional configuration
 * @param {boolean} params.options.skipOwnershipCheck - Skip ownership validation (for admin updates)
 * @param {boolean} params.options.skipUpdateCheck - Skip update permission check
 * @returns {Object} Updated order with all relations
 */
export const updateOrder = async ({
    orderId,
    userId,
    services,
    location,
    destination_location,
    orderData,
    files,
    options = {}
}) => {
    const {
        skipOwnershipCheck = false,
        skipUpdateCheck = false
    } = options;

    await sequelize.transaction(async (t) => {
        const existingOrder = await Order.findByPk(orderId, {
            include: [
                { model: Location, as: 'location' },
                { model: Location, as: 'destinationLocation' }
            ],
            transaction: t
        });

        if (!existingOrder) {
            throw new AppError('Order not found', 404);
        }

        // Validate ownership unless skipped
        if (!skipOwnershipCheck && userId) {
            validateOrderOwnership(existingOrder, userId);
        }

        // Check if order can be updated unless skipped
        if (!skipUpdateCheck) {
            await validateOrderCanBeUpdated(existingOrder.id);
        }

        // Update locations if provided
        const locationUpdates = await updateOrderLocations({
            order: existingOrder,
            location,
            destination_location,
            transaction: t
        });

        // Merge location updates with order data
        const finalOrderData = { ...orderData, ...locationUpdates };

        // Update order base fields
        if (Object.keys(finalOrderData).length > 0) {
            await existingOrder.update(finalOrderData, { transaction: t });
        }

        // Replace services if provided
        if (services) {
            await validateServicesAndAdditions(services);
            await replaceOrderServices({
                orderId: existingOrder.id,
                services,
                transaction: t
            });
        }

        // Handle image uploads if files are provided (inside transaction for consistency)
        if (files && files.length > 0) {
            const { saveOrderImages } = await import('../../utils/image.js');
            const imageFilenames = await saveOrderImages(files, { orderId: existingOrder.id });
            await existingOrder.update({ images: imageFilenames }, { transaction: t });
        }
    });

    // Fetch complete order outside transaction
    const updatedOrder = await Order.findByPk(orderId, {
        include: getOrderInclude()
    });

    return updatedOrder;
};


/**
 * Gets paginated list of orders
 * @param {Object} params
 * @param {Object} params.where - Sequelize where clause
 * @param {Object} params.filters - Query filters (page, limit, status, sort)
 * @param {Object} params.options - Optional configuration
 * @param {Array} params.options.include - Custom include array (defaults to standard includes)
 * @param {Object} params.options.attributes - Custom attributes config
 * @returns {Object} { orders, pagination }
 */
export const getOrders = async ({

    where = {},
    filters,
    options = {}
}) => {
    const { error, value } = commonFilterSchema.validate(filters);
    if (error) {
        throw new AppError(`Validation error: ${error.details[0].message}`, 400);
    }

    const { page, limit, status, sort } = value;
    const offset = (page - 1) * limit;

    // Add status filter to where clause
    const finalWhere = { ...where };
    if (status) finalWhere.status = status;

    // Convert numeric sort to SQL order (0 = ASC, 1 = DESC)
    const sortOrder = sort === 0 ? 'ASC' : 'DESC';

    // Use custom include or default
    const includeConfig = options.include || getOrderListInclude();
    const attributesConfig = options.attributes || getOrderAttributes();

    const { rows: orders, count } = await Order.findAndCountAll({
        where: finalWhere,
        attributes: attributesConfig,
        include: includeConfig,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', sortOrder]]
    });

    return {
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
            totalItems: count
        }
    };
};

/**
 * Gets a single order by ID
 * @param {Object} params
 * @param {number} params.orderId - Order ID
 * @param {Object} params.where - Additional where conditions (e.g., { client_id: userId })
 * @param {Object} params.options - Optional configuration
 * @param {Array} params.options.include - Custom include array
 * @param {Object} params.options.attributes - Custom attributes config
 * @returns {Object} Order with all relations
 */
export const getOrderById = async ({
    orderId,
    where = {},
    options = {}
}) => {
    const includeConfig = options.include || getOrderListInclude();
    const attributesConfig = options.attributes || getOrderAttributes();

    const order = await Order.findOne({
        where: {
            id: orderId,
            ...where
        },
        attributes: attributesConfig,
        include: includeConfig
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    return order;
};
