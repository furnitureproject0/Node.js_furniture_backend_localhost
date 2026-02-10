import { Offer, OrderTimeline } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { updateOrderStatusBasedOnServices } from '../order/index.js';
import {
    notifyCompanyAdminOfferAccepted,
    notifyCompanyAdminOfferRejected
} from '../../utils/notifications.js';
import { getOfferWithOrderInclude } from './offer.queries.js';

/**
 * Accepts an offer (client action)
 * @param {Object} params
 * @param {number} params.offerId - Offer ID
 * @param {number} params.userId - Client user ID
 * @returns {Promise<void>}
 */
export const acceptOffer = async ({ offerId, userId }) => {
    const offer = await Offer.findByPk(offerId, {
        include: getOfferWithOrderInclude()
    });

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    // Verify the offer is pending
    if (offer.status !== 'pending') {
        throw new AppError('Only pending offers can be accepted', 400);
    }

    // Verify client owns the order
    const order = offer.orderService.order;
    if (!order || order.client_id !== userId) {
        throw new AppError('You are not authorized to accept this offer', 403);
    }

    await sequelize.transaction(async (t) => {
        // Update offer status
        await offer.update(
            { status: 'accepted' },
            { transaction: t }
        );

        // Update order service status
        await offer.orderService.update(
            { status: 'offer_accepted' },
            { transaction: t }
        );

        // Add timeline entry
        await OrderTimeline.create(
            {
                order_id: order.id,
                status: 'offer_accepted',
                message: `Offer for service "${offer.orderService.service.name}" has been accepted`
            },
            { transaction: t }
        );

        // Update order status based on all services
        await updateOrderStatusBasedOnServices(order.id, t);
    });

    // Send notification to company admin
    try {
        await notifyCompanyAdminOfferAccepted({
            companyId: offer.company_id,
            offerId: offer.id,
            orderId: order.id,
            orderServiceId: offer.order_service_id,
            serviceName: offer.orderService.service.name
        });
    } catch (error) {
        console.error('Failed to send acceptance notification to company admin:', error);
    }
};

/**
 * Rejects an offer (client action)
 * @param {Object} params
 * @param {number} params.offerId - Offer ID
 * @param {number} params.userId - Client user ID
 * @returns {Promise<void>}
 */
export const rejectOffer = async ({ offerId, userId }) => {
    const offer = await Offer.findByPk(offerId, {
        include: getOfferWithOrderInclude()
    });

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    // Verify the offer is pending
    if (offer.status !== 'pending') {
        throw new AppError('Only pending offers can be rejected', 400);
    }

    // Verify client owns the order
    const order = offer.orderService.order;
    if (!order || order.client_id !== userId) {
        throw new AppError('You are not authorized to reject this offer', 403);
    }

    await sequelize.transaction(async (t) => {
        // Update offer status
        await offer.update(
            { status: 'rejected' },
            { transaction: t }
        );

        // Update order service status to offer_rejected
        await offer.orderService.update(
            { status: 'offer_rejected' },
            { transaction: t }
        );

        // Add timeline entry
        await OrderTimeline.create(
            {
                order_id: order.id,
                status: 'offer_rejected',
                message: `Offer for service "${offer.orderService.service.name}" has been rejected.`
            },
            { transaction: t }
        );

        // Update order status based on all services
        await updateOrderStatusBasedOnServices(order.id, t);
    });

    // Send notification to company admin
    try {
        await notifyCompanyAdminOfferRejected({
            companyId: offer.company_id,
            offerId: offer.id,
            orderId: order.id,
            orderServiceId: offer.order_service_id,
            serviceName: offer.orderService.service.name
        });
    } catch (error) {
        console.error('Failed to send rejection notification to company admin:', error);
    }
};
