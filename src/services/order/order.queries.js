import { OrderService as OrderServiceModel, Service, OrderServiceAddition, OrderTimeline, Location, Offer, User } from '../../models/index.js';

/**
 * Standard include configuration for basic order queries
 */
export const getOrderInclude = () => [
    {
        model: OrderServiceModel,
        as: 'orderServices',
        include: [
            { model: Service, as: 'service' },
            { model: OrderServiceAddition, as: 'additions' }
        ]
    },
    { model: OrderTimeline, as: 'timeline' },
    { model: Location, as: 'location' },
    { model: Location, as: 'destinationLocation' }
];

/**
 * Extended include configuration for list queries (includes offers)
 */
export const getOrderListInclude = () => [
    {
        model: OrderServiceModel,
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
];

/**
 * Default attributes configuration for order queries
 */
export const getOrderAttributes = () => ({
    exclude: ['client_id', 'location_id', 'destination_location_id']
});

/**
 * Company-specific include configuration (only shows orderServices assigned to company)
 * @param {number} companyId - Company ID to filter by
 */
export const getCompanyOrderInclude = (companyId) => [
    {
        model: OrderServiceModel,
        as: 'orderServices',
        attributes: { exclude: ['order_id', 'service_id', 'company_id'] },
        required: true,
        where: {
            company_id: companyId
        },
        include: [
            { model: Service, as: 'service', attributes: ['id', 'name'] },
            { model: Offer, as: 'offers', required: false },
            { model: OrderServiceAddition, as: 'additions', required: false }
        ]
    },
    {
        model: User,
        as: 'client',
        attributes: ['id', 'name', 'email']
    },
    { model: Location, as: 'location', required: false },
    { model: Location, as: 'destinationLocation', required: false }
];
