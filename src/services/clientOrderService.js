import { Order, OrderService, OrderTimeline, Service, Location, OrderServiceAddition, Offer } from '../models/index.js';
import sequelize from '../config/database.js';
import AppError from '../utils/AppError.js';
import {
    validateServicesAndAdditions,
    validateOrderOwnership,
    validateOrderCanBeUpdated,
    createOrderLocations,
    updateOrderLocations,
    createOrderServicesAndAdditions,
    replaceOrderServices,
    saveAndAttachOrderImages,
    cancelOrderWithRelations,
    validateOrderCanBeCancelled
} from './order/index.js';
import { commonFilterSchema } from '../validation/global-schemas.js';
import { saveOrderImages } from '../utils/image.js';


/**
 * Creates a new client order with all related entities
 * @param {Object} params
 * @param {number} params.clientId - Client user ID
 * @param {Array} params.services - Array of services with additions
 * @param {Object} params.location - Pickup location data
 * @param {Object} params.destination_location - Optional destination location data
 * @param {Object} params.orderData - Additional order data
 * @param {Array} params.files - Optional uploaded files
 * @returns {Object} Created order with all relations
 */
export const createClientOrder = async ({ clientId, services, location, destination_location, orderData, files }) => {
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
            status: 'pending',
            message: 'Order created successfully'
        }, { transaction: t });

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
 * Updates an existing client order
 * @param {Object} params
 * @param {number} params.orderId - Order ID to update
 * @param {number} params.userId - User ID performing the update
 * @param {Array} params.services - Optional updated services array
 * @param {Object} params.location - Optional updated pickup location
 * @param {Object} params.destination_location - Optional updated destination location
 * @param {Object} params.orderData - Additional order data to update
 * @param {Array} params.files - Optional uploaded files
 * @returns {Object} Updated order with all relations
 */
export const updateClientOrder = async ({ orderId, userId, services, location, destination_location, orderData, files }) => {
    const order = await sequelize.transaction(async (t) => {
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

        // Validate ownership
        validateOrderOwnership(existingOrder, userId);

        // Check if order can be updated
        await validateOrderCanBeUpdated(existingOrder.id);

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

        if (files && files.length > 0) {
            const imageFilenames = await saveAndAttachOrderImages({ order, files });
            if (imageFilenames) {
                order.images = imageFilenames;
            }
        }

        return existingOrder;
    });

    return order;
};

/**
 * Cancels a client order
 * @param {Object} params
 * @param {number} params.orderId - Order ID to cancel
 * @param {number} params.userId - User ID performing the cancellation
 * @param {string} params.userRole - User role (for authorization)
 * @param {string} params.reason - Optional cancellation reason
 * @returns {Object} Cancelled order
 */
export const cancelClientOrder = async ({ orderId, userId, userRole, reason }) => {
    const order = await sequelize.transaction(async (t) => {
        const existingOrder = await Order.findByPk(orderId, {
            include: [
                {
                    model: OrderService,
                    as: 'orderServices',
                    include: [{ model: Service, as: 'service' }]
                }
            ],
            transaction: t
        });

        if (!existingOrder) {
            throw new AppError('Order not found', 404);
        }


        validateOrderOwnership(existingOrder, userId);

        // Check if order can be cancelled
        await validateOrderCanBeCancelled(existingOrder.id);

        // Cancel order and all related entities
        await cancelOrderWithRelations({
            order: existingOrder,
            reason,
            transaction: t
        });

        return existingOrder;
    });

    return order;
};

/**
 * Gets paginated list of client orders
 * @param {Object} params
 * @param {number} params.clientId - Client user ID
 * @param {Object} params.filters - Query filters (page, limit, status, sort)
 * @returns {Object} { orders, pagination }
 */
export const getClientOrders = async ({ clientId, filters }) => {
    const { error, value } = commonFilterSchema.validate(filters);
    if (error) {
        throw new AppError(`Validation error: ${error.details[0].message}`, 400);
    }

    const { page, limit, status, sort } = value;
    const offset = (page - 1) * limit;

    const where = { client_id: clientId };
    if (status) where.status = status;

    // Convert numeric sort to SQL order (0 = ASC, 1 = DESC)
    const sortOrder = sort === 0 ? 'ASC' : 'DESC';

    const { rows: orders, count } = await Order.findAndCountAll({
        where,
        attributes: { exclude: ['client_id', 'location_id', 'destination_location_id'] },
        include: [
            {
                model: OrderService,
                as: 'orderServices',
                attributes: { exclude: ['order_id', 'service_id', 'company_id'] },
                include: [
                    { model: Service, as: 'service' },
                    { model: Offer, as: 'offers' },
                    { model: OrderServiceAddition, as: 'additions' }
                ]
            },
            { model: OrderTimeline, as: 'timeline' },
            { model: Location, as: 'location' },
            { model: Location, as: 'destinationLocation' }
        ],
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
 * Gets a single client order by ID
 * @param {Object} params
 * @param {number} params.orderId - Order ID
 * @param {number} params.clientId - Client user ID
 * @returns {Object} Order with all relations
 */
export const getClientOrderById = async ({ orderId, clientId }) => {
    const order = await Order.findOne({
        where: {
            id: orderId,
            client_id: clientId
        },
        attributes: { exclude: ['client_id', 'location_id', 'destination_location_id'] },
        include: [
            {
                model: OrderService,
                as: 'orderServices',
                attributes: { exclude: ['order_id', 'service_id', 'company_id'] },
                include: [
                    { model: Service, as: 'service' },
                    { model: Offer, as: 'offers' },
                    { model: OrderServiceAddition, as: 'additions' }
                ]
            },
            { model: OrderTimeline, as: 'timeline' },
            { model: Location, as: 'location' },
            { model: Location, as: 'destinationLocation' }
        ]
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    return order;
};
