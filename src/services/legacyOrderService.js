import { Order, OrderTimeline, Service, OrderService, Location, OrderServiceAddition } from '../models/index.js';
import sequelize from '../config/database.js';
import { validateServicesAndAdditions } from './order/index.js';



export const createOrder = async ({
    clientId,
    services,
    location,
    destination_location = null,
    orderData = {},
    options = {},
    transaction = null
}) => {
    const {
        orderServiceStatus = 'pending',
        companyId = null,
        timelineMessage = 'Order created successfully',
        timelineStatus = 'pending'
    } = options;

    // Use provided transaction or create a new one
    const executeInTransaction = async (t) => {
        await validateServicesAndAdditions(services);
        const pickupLocation = await Location.create(location, { transaction: t });

        let destinationLocation = null;
        if (destination_location) {
            destinationLocation = await Location.create(destination_location, { transaction: t });
        }

        // Create order
        const order = await Order.create({
            ...orderData,
            client_id: clientId,
            location_id: pickupLocation.id,
            destination_location_id: destinationLocation?.id || null
        }, { transaction: t });

        // Create order services and their additions
        if (companyId) {
            // Bulk create approach (used in company employee controller)
            const orderServiceRecords = services.map(service => ({
                order_id: order.id,
                service_id: service.service_id,
                status: orderServiceStatus,
                company_id: companyId
            }));

            const createdOrderServices = await OrderService.bulkCreate(
                orderServiceRecords,
                { transaction: t }
            );

            // Map by index to handle cases where same service_id might appear multiple times
            // bulkCreate returns records in the same order as the input array
            const additionsRecords = [];
            services.forEach((service, index) => {
                if (!service.additions?.length) return;

                const orderService = createdOrderServices[index];
                if (!orderService) return;

                for (const add of service.additions) {
                    additionsRecords.push({
                        order_service_id: orderService.id,
                        addition_id: add.addition_id,
                        note: add.note || null
                    });
                }
            });

            // Bulk create all additions
            if (additionsRecords.length > 0) {
                await OrderServiceAddition.bulkCreate(additionsRecords, {
                    transaction: t
                });
            }
        } else {
            // Sequential create approach (used in client order controller)
            for (const { service_id, additions } of services) {
                const orderService = await OrderService.create({
                    order_id: order.id,
                    service_id: service_id,
                    status: orderServiceStatus
                }, { transaction: t });

                if (additions?.length) {
                    const additionRecords = additions.map(add => ({
                        order_service_id: orderService.id,
                        addition_id: add.addition_id,
                        note: add.note || null
                    }));

                    await OrderServiceAddition.bulkCreate(additionRecords, { transaction: t });
                }
            }
        }

        // Create initial timeline entry
        await OrderTimeline.create({
            order_id: order.id,
            status: timelineStatus,
            message: timelineMessage
        }, { transaction: t });

        // Reload with relations
        await order.reload({
            include: [
                {
                    model: OrderService,
                    as: "orderServices",
                    include: [
                        { model: Service, as: "service" },
                        { model: OrderServiceAddition, as: "additions" }
                    ]
                },
                { model: OrderTimeline, as: "timeline" },
                { model: Location, as: "location" },
                { model: Location, as: "destinationLocation" }
            ],
            transaction: t
        });

        return order;
    };

    // If transaction is provided, use it; otherwise create a new one
    if (transaction) {
        return await executeInTransaction(transaction);
    } else {
        return await sequelize.transaction(async (t) => {
            return await executeInTransaction(t);
        });
    }
};

