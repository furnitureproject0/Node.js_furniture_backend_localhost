'use strict';

import { Offer, Order } from "../../models/index.js";
import { createOrderService, updateOrderService, getAllOrders } from "../order-v2/index.js";
import AppError from "../../utils/AppError.js";

/**
 * Get all offers (uses getAllOrders with a fixed type filter)
 * @params {Object} filters - Filters for searching offers (status, execution_date, price range, etc.)
 * @params {string} search - Search keyword (searches across clients, locations, vehicles, and company)
 * @params {Object} pagination - Pagination parameters (page, limit)
 * @params {Object} options - Additional Sequelize options (e.g., transaction)
 * @returns {Object} Filtered, searched, and paginated list of offers
 * 
 * This service is a simple wrapper around the existing getAllOrders service, with the addition of a fixed filter to only retrieve records of type 'offer'. 
 * This allows us to reuse all the existing filtering, searching, and pagination logic while ensuring we only get offers. 
 * The returned data structure is the same as for orders, but it will only include offers. 
 * 
 * Business Rule: Offers are a specific type of order, so we can leverage the existing order retrieval logic while applying a fixed filter to distinguish offers from regular orders.
 */
export const getOffersList = async (filters = {}, search = '', pagination = {}, options = {}) => {
    // Force the filter to only fetch 'offer' types
    const offerFilters = { ...filters, type: 'offer' };
    return await getAllOrders(offerFilters, search, pagination, options);
};