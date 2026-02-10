import { OrderService, Offer, Order, Company } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { getOfferInclude } from './offer.queries.js';

/**
 * Gets offers for an order service with role-based filtering
 * @param {Object} params
 * @param {number} params.orderServiceId - Order service ID
 * @param {Object} params.actor - Actor { id, role, company_id }
 * @returns {Promise<Array>} List of offers
 */
export const getOffersForOrderService = async ({ orderServiceId, actor }) => {
    const { id: userId, role: userRole, company_id: companyId } = actor;

    // Verify order service exists
    const orderService = await OrderService.findByPk(orderServiceId, {
        include: [
            {
                model: Order,
                as: 'order',
                attributes: ['id', 'client_id']
            }
        ]
    });

    if (!orderService) {
        throw new AppError('Order service not found', 404);
    }

    // Build query based on role
    const whereClause = { order_service_id: orderServiceId };

    if (userRole === 'company_admin') {
        // Company admin can only see their own offers
        whereClause.company_id = companyId;
    } else if (userRole === 'client') {
        // Client can only view offers for their orders
        if (orderService.order.client_id !== userId) {
            throw new AppError('You are not authorized to view offers for this order service', 403);
        }
        // Client can see all offers for their order service
    } else {
        throw new AppError('You are not authorized to view offers', 403);
    }

    const offers = await Offer.findAll({
        where: whereClause,
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    return offers;
};

/**
 * Gets a single offer by ID with role-based access control
 * @param {Object} params
 * @param {number} params.offerId - Offer ID
 * @param {Object} params.actor - Actor { id, role, company_id }
 * @returns {Promise<Offer>} Offer
 */
export const getOfferById = async ({ offerId, actor }) => {
    const { id: userId, role: userRole, company_id: companyId } = actor;

    const offer = await Offer.findByPk(offerId, {
        include: getOfferInclude()
    });

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    // Check access permission
    const orderService = offer.orderService;
    if (userRole === 'company_admin') {
        // Company admin can only view their company's offers
        if (offer.company_id !== companyId) {
            throw new AppError('You are not authorized to view this offer', 403);
        }
    } else if (userRole === 'client') {
        // Client can only view offers for their orders
        const order = await orderService.getOrder();
        if (order.client_id !== userId) {
            throw new AppError('You are not authorized to view this offer', 403);
        }
    }

    return offer;
};
