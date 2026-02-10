import { OrderService, Offer, OrderTimeline, Service, Order } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { createAndSendNotification } from '../../utils/notifications.js';

/**
 * Creates a new offer for an order service
 * @param {Object} params
 * @param {number} params.orderServiceId - Order service ID
 * @param {number} params.companyId - Company ID
 * @param {Object} params.offerData - Offer data (price, description, etc.)
 * @returns {Promise<Offer>} Created offer
 */
export const createOffer = async ({ orderServiceId, companyId, offerData }) => {
    const orderService = await OrderService.findByPk(orderServiceId, {
        include: [{ model: Service, as: "service" }],
    });

    if (!orderService) {
        throw new AppError("Order service not found", 404);
    }

    // Check if company is assigned to this order service
    if (orderService.company_id !== companyId) {
        throw new AppError(
            "You are not authorized to make an offer for this service",
            403
        );
    }

    // Check for active offers (pending or accepted)
    const activeOffer = await Offer.findOne({
        where: {
            order_service_id: orderServiceId,
            status: ["pending", "accepted"],
        },
    });

    if (activeOffer) {
        throw new AppError(
            "An active offer already exists for this order service",
            400
        );
    }

    // Create offer
    const offer = await sequelize.transaction(async (t) => {
        const newOffer = await Offer.create(
            {
                order_service_id: orderServiceId,
                company_id: companyId,
                ...offerData,
            },
            { transaction: t }
        );

        // Update order service status to offer_sent
        await orderService.update(
            { status: 'offer_sent' },
            { transaction: t }
        );

        // Add timeline entry
        await OrderTimeline.create(
            {
                order_id: orderService.order_id,
                status: "offer_sent",
                message: `You have received an offer for service ${orderService.service.name}`,
            },
            { transaction: t }
        );

        return newOffer;
    });

    // Send notification to client
    try {
        const order = await Order.findByPk(orderService.order_id);

        if (order) {
            await createAndSendNotification({
                user_id: order.client_id,
                title: 'New Offer Received',
                message: `you have received an offer for service "${orderService.service.name}".`,
                type: 'offer',
                payload: {
                    offer_id: offer.id,
                    order_id: orderService.order_id,
                    order_service_id: orderServiceId,
                    service_name: orderService.service.name,
                    action: 'offer_created',
                    link: `/orders/${orderService.order_id}`
                }
            });
        }
    } catch (error) {
        console.error('Failed to send offer notification to client:', error);
    }

    return offer;
};
