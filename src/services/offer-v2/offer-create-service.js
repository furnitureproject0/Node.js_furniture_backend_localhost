'use strict';

import { Offer } from "../../models/index.js";
import { createOrderService } from "../order-v2/index.js";

/**
 * Create a new Offer (An Order with type 'offer' and an associated Offer record)
 * @params {Object} data - Offer data from request body
 * @params {Object} options - Additional options (e.g., transaction)
 * @returns {Object} Created offer with its order details
 * 
 * This service reuses the existing order creation logic to ensure all related entities (services, additions, locations) are created correctly. 
 * After creating the order with type 'offer', it creates a corresponding record in the Offers table to manage the negotiation process.
 * The returned object includes the order details along with its associated offer information.
 * 
 * Note: The Offer record is initialized with client_accepted and company_accepted set to false, and is_confirmed set to false. 
 * These fields will be updated through separate services when the client and company accept the offer and when the offer is confirmed.
 * 
 * Business Rule: An offer is essentially an order with a specific type and an associated negotiation record. 
 * This design allows us to leverage the existing order infrastructure while providing a clear distinction between regular orders and offers.
 */
export const createOffer = async (data, options = {}) => {
    const { transaction } = options;

    // 1. Force type to 'offer' before calling order service
    const offerData = { ...data, type: 'offer' };

    // 2. Reuse the powerful order creation logic
    const order = await createOrderService(offerData, { transaction });

    // 3. Create the negotiation record in the Offers table
    const offerDetails = await Offer.create({
        order_id: order.id,
        client_accepted: false, // client needs to accept the offer
        company_accepted: false, // This will be updated by a separate sync service based on acceptances or order company
        all_companies_accepted: false, // This will be updated by a separate sync service based on company acceptances
        is_confirmed: false // This will be updated by a separate sync service when both sides have accepted and the offer is confirmed
    }, { transaction });

    // order.reload({ // Reload to include the new Offer association if needed
    //     include: [{ model: Offer, as: 'offerDetails' }],
    //     transaction
    // });
    return {
        ...order,
        offerDetails: offerDetails.toJSON()
    };
};