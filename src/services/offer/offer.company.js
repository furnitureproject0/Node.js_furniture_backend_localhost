import { OrderService, Offer, OrderTimeline, Order } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { updateOrderStatusBasedOnServices } from '../order/index.js';
import { notifyClientOfferCancelled } from '../../utils/notifications.js';
import { getOfferForCancelInclude } from './offer.queries.js';

/**
 * Cancels an offer (company action)
 * @param {Object} params
 * @param {number} params.offerId - Offer ID
 * @param {number} params.companyId - Company ID
 * @returns {Promise<void>}
 */
export const cancelOffer = async ({ offerId, companyId }) => {
    const offer = await Offer.findOne({
        where: {
            id: offerId,
            company_id: companyId,
        },
        include: getOfferForCancelInclude()
    });

    if (!offer) {
        throw new AppError("Offer not found", 404);
    }

    if (offer.status !== "pending") {
        throw new AppError("Only pending offers can be cancelled", 400);
    }

    await sequelize.transaction(async (t) => {
        await offer.update(
            { status: "cancelled" },
            { transaction: t }
        );

        // Revert OrderService status based on previous status
        // If it was offer_sent, revert to accepted_by_company or assigned
        const orderService = await OrderService.findByPk(offer.order_service_id, {
            transaction: t
        });

        if (orderService) {
            let newStatus = 'assigned'; // Default fallback

            // If company had accepted before sending offer, revert to accepted_by_company
            // Otherwise revert to assigned
            if (orderService.status === 'offer_sent') {
                // Check if there was a previous accepted_by_company status
                // For now, we'll revert to assigned since we don't track history
                // In a more sophisticated system, you might check timeline or status history
                newStatus = 'assigned';
            }

            await orderService.update(
                { status: newStatus },
                { transaction: t }
            );

            // Update order status based on all services
            await updateOrderStatusBasedOnServices(orderService.order_id, t);
        }

        await OrderTimeline.create(
            {
                order_id: offer.orderService.order_id,
                status: "offer_cancelled",
                message: `Offer for service ${offer.orderService.service.name} has been cancelled by the company`,
            },
            { transaction: t }
        );
    });

    // Send notification to client
    try {
        const order = await Order.findByPk(offer.orderService.order_id);

        if (order) {
            await notifyClientOfferCancelled({
                clientId: order.client_id,
                offerId: offer.id,
                orderId: order.id,
                orderServiceId: offer.order_service_id,
                serviceName: offer.orderService.service.name
            });
        }
    } catch (error) {
        console.error('Failed to send cancellation notification to client:', error);
    }
};
