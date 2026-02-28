'use strict';

import { Order } from '../../models/index.js';
import { cancelOrder } from '../order/index.js'; // السيرفيس الأساسية
import AppError from '../../utils/AppError.js';

/**
 * Cancel an offer after validating its type
 * @param {number} offerId - ID of the offer
 * @param {number} userId - ID of the user performing the action
 * @param {string} userRole - Role of the user
 * @param {string} reason - Reason for cancellation
 * @param {Object} options - Additional options including transaction
 * @returns {Object} Cancelled offer object
 */
export const cancelOfferService = async (offerId, userId, userRole, reason, options = {}) => {
    const { transaction } = options;

    const targetOrder = await Order.findByPk(offerId, { transaction });

    if (!targetOrder) {
        throw new AppError('Record not found', 404);
    }
    
    if (targetOrder.type !== 'offer') {
        throw new AppError('Invalid operation: This ID belongs to an order, not an offer', 400);
    }

    const cancelledOffer = await cancelOrder({
        orderId: offerId,
        userId: userId,
        userRole: userRole,
        reason: reason || 'Offer cancelled by admin',
        options: {
            transaction, 
            skipOwnershipCheck: ['super_admin', 'site_admin', 'company_admin', 'company_secretary'].includes(userRole)
        }
    });

    return cancelledOffer;
};