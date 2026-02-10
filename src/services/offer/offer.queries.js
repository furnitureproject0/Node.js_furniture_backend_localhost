import { OrderService, Service, Order, Company } from '../../models/index.js';

/**
 * Standard offer include configuration
 */
export const getOfferInclude = () => [
    {
        model: OrderService,
        as: 'orderService',
        include: [
            {
                model: Service,
                as: 'service',
                attributes: ['id', 'name']
            }
        ]
    },
    {
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
    }
];

/**
 * Offer include with Order for accept/reject operations
 */
export const getOfferWithOrderInclude = () => [
    {
        model: OrderService,
        as: 'orderService',
        include: [
            { model: Service, as: 'service' },
            { model: Order, as: 'order' }
        ]
    }
];

/**
 * Offer include for cancellation (company operations)
 */
export const getOfferForCancelInclude = () => [
    {
        model: OrderService,
        as: 'orderService',
        include: [{ model: Service, as: 'service' }]
    }
];
