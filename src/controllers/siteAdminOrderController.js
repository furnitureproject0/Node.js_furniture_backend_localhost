import { Order, OrderService, OrderTimeline, Company, Service, User, Offer, Location, OrderServiceAddition } from '../models/index.js';
import sequelize from '../config/database.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { findCompaniesProvidingService } from '../utils/companies.js';
import { notifyCompanyAdminAssigned, createAndSendNotification } from '../utils/notifications.js';
import { saveOrderImages } from '../utils/image.js';
import { validateServicesAndAdditions } from '../services/order/index.js';
import { generateOrderCreatedTemplate } from '../emailTemplates/orderCreatedTemplate.js';
import jwt from 'jsonwebtoken';

import { Op } from 'sequelize';

export const getSiteAdminOrders = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, status, sort = 1, search, date, service_id } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const where = {};
    const include = [];

    // Status filter - Default to not cancelled if no status provided
    if (status) {
        where.status = status;
    } else {
        where.status = { [Op.ne]: 'cancelled' };
    }

    // Date filter
    if (date) {
        where.preferred_date = date;
    }

    // Search filter
    if (search) {
        const searchConditions = [
            { '$client.name$': { [Op.like]: `%${search}%` } },
            { '$client.email$': { [Op.like]: `%${search}%` } },
            { '$location.address$': { [Op.like]: `%${search}%` } },
            { '$destinationLocation.address$': { [Op.like]: `%${search}%` } }
        ];

        // Check if search is a valid number to assume it's an ID
        if (!isNaN(search)) {
            searchConditions.push({ id: search });
        }

        where[Op.or] = searchConditions;
    }

    const sortOrder = sort === 0 ? "ASC" : "DESC";

    // Build OrderService include based on service_id filter
    const orderServiceInclude = {
        model: OrderService,
        as: 'orderServices',
        attributes: { exclude: ['order_id', 'service_id', 'company_id'] },
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name'],
                required: false
            },
            {
                model: Service,
                as: 'service',
                attributes: ['id', 'name']
            },
            {
                model: Offer,
                as: 'offers',
                required: false
            },
            {
                model: OrderServiceAddition,
                as: 'additions',
                required: false
            }
        ]
    };

    if (service_id) {
        orderServiceInclude.where = { service_id };
        orderServiceInclude.required = true; // Inner join to only return orders with this service
    }

    const { rows: orders, count } = await Order.findAndCountAll({
        where,
        attributes: { exclude: ['client_id', 'location_id', 'destination_location_id'] },
        include: [
            orderServiceInclude,
            {
                model: User,
                as: 'client',
                attributes: ['id', 'name', 'email']
            },
            {
                model: OrderTimeline,
                as: 'timeline',
                required: false
            },
            {
                model: Location,
                as: 'location',
            },
            {
                model: Location,
                as: 'destinationLocation',
                required: false
            }
        ],
        limit,
        offset,
        distinct: true,
        order: [["createdAt", sortOrder]],
        subQuery: false
    });

    res.status(200).json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
            orders
        },
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalItems: count
        }
    });
});

export const getSiteAdminOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        attributes: { exclude: ['client_id', 'location_id', 'destination_location_id'] },
        include: [
            {
                model: OrderService,
                as: 'orderServices',
                attributes: { exclude: ['order_id', 'service_id', 'company_id'] },
                include: [
                    {
                        model: Company,
                        as: 'company',
                        attributes: ['id', 'name'],
                        required: false
                    },
                    {
                        model: Service,
                        as: 'service',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Offer,
                        as: 'offers',
                        required: false
                    },
                    {
                        model: OrderServiceAddition,
                        as: 'additions',
                        required: false
                    }
                ]
            },
            {
                model: User,
                as: 'client',
                attributes: ['id', 'name', 'email']
            },
            {
                model: OrderTimeline,
                as: 'timeline',
                required: false
            },
            {
                model: Location,
                as: 'location',
            },
            {
                model: Location,
                as: 'destinationLocation',
                required: false
            }
        ],
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Order retrieved successfully',
        data: { order }
    });
});

export const getAvailableCompanies = asyncHandler(async (req, res) => {
    const { orderId, orderServiceId } = req.params;

    // Verify order service exists
    const orderService = await OrderService.findOne({
        where: {
            order_id: orderId,
            id: orderServiceId
        },
        include: [
            {
                model: Service,
                attributes: ['id', 'name'],
                as: 'service'
            }
        ]
    });

    if (!orderService) {
        throw new AppError('Order service not found', 404);
    }

    // Get companies that provide this service (reusable helper)
    const companies = await findCompaniesProvidingService(orderService.service_id);

    res.status(200).json({
        success: true,
        message: 'Available companies retrieved successfully',
        data: { companies }
    });
});

export const assignCompanyToOrderService = asyncHandler(async (req, res) => {
    const { orderId, orderServiceId } = req.params;
    const { companyId } = req.body;

    const result = await sequelize.transaction(async (t) => {
        // Find and verify order service
        const orderService = await OrderService.findOne({
            where: {
                order_id: orderId,
                id: orderServiceId
            },
            include: [
                {
                    model: Service,
                    attributes: ['id', 'name'],
                    as: 'service'
                }
            ],
            transaction: t
        });

        if (!orderService) {
            throw new AppError('Order service not found', 404);
        }

        // Get companies that provide this service (reusable helper)
        const companies = await findCompaniesProvidingService(orderService.service_id);

        if (!companies.some(company => company.id === companyId)) {
            throw new AppError('Company not found or not providing this service', 404);
        }

        // Update order service
        await orderService.update({
            company_id: companyId,
            status: 'assigned'
        }, { transaction: t });

        // Add timeline entry for assignment
        await OrderTimeline.create({
            order_id: orderId,
            status: 'assigned',
            message: `Service "${orderService.service.name}" has been assigned to a company`
        }, { transaction: t });

        // Reload order service with associations
        await orderService.reload({
            include: [
                {
                    model: Company,
                    attributes: ['id', 'name'],
                    as: 'company'
                },
                {
                    model: Service,
                    attributes: ['id', 'name'],
                    as: 'service'
                }
            ],
            transaction: t
        });

        return orderService;
    });

    res.status(200).json({
        success: true,
        message: 'Company assigned to order service successfully',
        data: { orderService: result }
    });

    notifyCompanyAdminAssigned({
        companyId: companyId,
        orderId,
        orderServiceId
    }).catch(() => { });
});

export const createOrderAsSiteAdmin = asyncHandler(async (req, res) => {
    const { services, location, destination_location, email, order_type, ...orderData } = req.body;

    if (orderData.number_of_rooms === '') {
        orderData.number_of_rooms = null;
    }
    console.log(req.body)
    const client = await User.findOne({
        where: { email, role: 'client' }
    });

    if (!client) {
        throw new AppError('Client not found or invalid client ID', 404);
    }

    const result = await sequelize.transaction(async (t) => {
        // Validate services
        await validateServicesAndAdditions(services);

        const pickupLocation = await Location.create(location, { transaction: t });

        // Create destination location if provided
        let destinationLocation = null;
        if (destination_location && destination_location.address) {
            destinationLocation = await Location.create(destination_location, { transaction: t });
        }

        // Create order
        const order = await Order.create({
            ...orderData,
            client_id: client.id,
            location_id: pickupLocation.id,
            destination_location_id: destinationLocation?.id || null
        }, { transaction: t });

        // create order serviceds and additions
        const orderServiceRecords = services.map(service => ({
            order_id: order.id,
            service_id: service.service_id,
            status: "assigned",
            company_id: service.company_id
        }))

        const createdOrderServices = await OrderService.bulkCreate(
            orderServiceRecords,
            { transaction: t }
        )

        const serviceIdToOrderServiceId = new Map();
        createdOrderServices.forEach(orderService => {
            serviceIdToOrderServiceId.set(orderService.service_id, orderService.id)
        })

        const additionsRecords = [];
        for (const { service_id, additions } of services) {
            if (!additions?.length) continue;

            const orderServiceId = serviceIdToOrderServiceId.get(service_id)

            for (const add of additions) {
                additionsRecords.push({
                    order_service_id: orderServiceId,
                    addition_id: add.addition_id,
                    note: add.note || null
                })
            }
        }

        if (additionsRecords.length) {
            await OrderServiceAddition.bulkCreate(additionsRecords, {
                transaction: t
            });
        }

        // Handle Offers
        const offerRecords = [];
        for (const service of services) {
            if (service.offer && service.company_id) {
                const orderServiceId = serviceIdToOrderServiceId.get(service.service_id);
                if (orderServiceId) {
                    offerRecords.push({
                        order_service_id: orderServiceId,
                        company_id: service.company_id,
                        hourly_rate: service.offer.hourly_rate,
                        currency: service.offer.currency || 'CHF',
                        min_hours: service.offer.min_hours,
                        max_hours: service.offer.max_hours,
                        notes: service.offer.notes,
                        date: orderData.preferred_date,
                        time: orderData.preferred_time,
                        status: order_type === 'order' ? 'accepted' : 'pending'
                    });
                }
            }
        }

        if (offerRecords.length > 0) {
            await Offer.bulkCreate(offerRecords, { transaction: t });
        }

        // Create initial timeline entry
        await OrderTimeline.create({
            order_id: order.id,
            status: "pending",
            message: `Order created successfully`
        }, { transaction: t });

        return order;
    });

    // Send order creation email to client
    const generateOrderAccessToken = (orderId, userId) => {
        return jwt.sign(
            { id: userId, orderId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    };

    // Get company name from the first service (if available)
    let companyName = "Furniture Services"; // Default fallback
    if (services.length > 0 && services[0].company_id) {
        const company = await Company.findByPk(services[0].company_id);
        if (company) {
            companyName = company.name;
        }
    }

    const orderAccessToken = generateOrderAccessToken(result.id, client.id);
    const orderLink = `${process.env.CLIENT_URL}/client/order/${result.id}?token=${orderAccessToken}`;
    const sendEmail = (await import('../utils/sendEmail.js')).default;
    try {
        await sendEmail({
            to: client.email,
            subject: `New Order Created - Order #${result.id}`,
            html: generateOrderCreatedTemplate({
                clientName: client.name,
                companyName: companyName,
                orderId: result.id,
                order: result,
                orderLink: orderLink
            })
        });
    } catch (error) {
        console.error('Failed to send order creation email:', error);
    }

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order: result }
    });
});