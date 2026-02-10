import asyncHandler from 'express-async-handler';
import * as orderService from '../services/order/order.service.js';
import * as orderNotificationService from '../services/order/order.notification.js';


export const createOrder = asyncHandler(async (req, res) => {
    const { services, location, destination_location, ...orderData } = req.body;

    const order = await orderService.createOrder({
        clientId: req.user.id,
        services,
        location,
        destination_location,
        orderData,
        files: req.files
    });

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order }
    });

    // Non-blocking notification
    setImmediate(() => {
        orderNotificationService.notifyOrderCreated({
            orderId: order.id,
            clientId: req.user.id,
            clientName: req.user.name
        });
    });
});

export const updateOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { services, location, destination_location, ...orderData } = req.body;

    const order = await orderService.updateOrder({
        orderId: id,
        userId: req.user.id,
        services,
        location,
        destination_location,
        orderData,
        files: req.files
    });

    res.status(200).json({
        success: true,
        message: "Order updated successfually",
        data: { order }
    });
});

export const getClientOrders = asyncHandler(async (req, res) => {
    const { orders, pagination } = await orderService.getOrders({
        where: { client_id: req.user.id },
        filters: req.query
    });

    res.status(200).json({
        success: true,
        message: "Client orders fetched successfully",
        data: { orders },
        pagination
    });
});

export const getClientOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await orderService.getOrderById({
        orderId: id,
        where: { client_id: req.user.id }
    });

    res.status(200).json({
        success: true,
        message: "Order retrieved successfully",
        data: { order }
    });
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};

    const order = await orderService.cancelOrder({
        orderId: id,
        userId: req.user.id,
        userRole: req.user.role,
        reason
    });

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        data: { order }
    });

    // Non-blocking notification
    setImmediate(() => {
        orderNotificationService.notifyOrderCancelled({
            orderId: order.id,
            reason
        });
    });
});
