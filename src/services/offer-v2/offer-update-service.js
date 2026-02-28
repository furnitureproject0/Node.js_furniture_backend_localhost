'use strict';

import { Order } from "../../models/index.js";
import { updateOrderService } from "../order-v2/index.js";
import AppError from "../../utils/AppError.js";
import e from "express";

/**
 * Update an existing Offer
 * @param {number} offerId - ID of the offer to update
 * @param {Object} data - Updated offer data (same structure as order update)
 * @param {Object} options - Optional configuration (e.g., transaction)
 * @returns {Object} Updated offer with its order details
 * 
 * This service reuses the existing order update logic to ensure all related entities (services, additions, locations) are updated correctly. 
 * It first checks if the specified ID corresponds to an offer (order with type 'offer') before proceeding with the update. 
 * If the offer is found and valid, it calls the order update service to perform the update.
 * The returned object includes the updated order details along with its associated offer information.
 * 
 * Business Rule: An offer is essentially an order with a specific type and an associated negotiation record. 
 * This design allows us to leverage the existing order infrastructure while providing a clear distinction between regular orders and offers.
 */
export const updateOffer = async (offerId, data, options = {}) => {
    const { transaction } = options;

    // Check if it's actually an offer before updating
    const order = await Order.findByPk(offerId, { transaction });
    if (!order || order.type !== 'offer') {
        throw new AppError('Offer not found or invalid type', 404);
    }

    // Reuse the order update logic (handles pricing ranges, etc.)
    return await updateOrderService(offerId, data, { transaction });
};