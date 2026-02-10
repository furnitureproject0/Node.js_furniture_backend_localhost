import asyncHandler from 'express-async-handler';
import {
    getOrders,
    getOrderById,
    getCompanyOrderInclude,
    getOrderAttributes,
    acceptCompanyOrderService,
    rejectCompanyOrderService,
    cancelOrderService as cancelOrderServiceFn
} from '../services/order/index.js';

export const getCompanyOrders = asyncHandler(async (req, res) => {
    const { orders, pagination } = await getOrders({
        filters: req.query,
        options: {
            include: getCompanyOrderInclude(req.user.company_id),
            attributes: getOrderAttributes()
        }
    });

    res.status(200).json({
        success: true,
        message: 'Orders retrieved successfully',
        data: { orders },
        pagination
    });
});

export const getCompanyOrderById = asyncHandler(async (req, res) => {
    const order = await getOrderById({
        orderId: req.params.id,
        options: {
            include: getCompanyOrderInclude(req.user.company_id),
            attributes: getOrderAttributes()
        }
    });

    res.status(200).json({
        success: true,
        message: 'Order retrieved successfully',
        data: { order }
    });
});

export const acceptOrderService = asyncHandler(async (req, res) => {
    const { orderId, orderServiceId } = req.params;

    const orderService = await acceptCompanyOrderService({
        companyId: req.user.company_id,
        orderId,
        orderServiceId
    });

    res.status(200).json({
        success: true,
        message: 'Order service accepted successfully',
        data: { orderService }
    });
});

export const rejectOrderService = asyncHandler(async (req, res) => {
    const { orderId, orderServiceId } = req.params;
    const { reason } = req.body || {};

    const orderService = await rejectCompanyOrderService({
        companyId: req.user.company_id,
        orderId,
        orderServiceId,
        reason
    });

    res.status(200).json({
        success: true,
        message: 'Order service rejected successfully',
        data: { orderService }
    });
});

export const cancelOrderService = asyncHandler(async (req, res) => {
    const { orderServiceId } = req.params;
    const { reason } = req.body || {};

    const orderService = await cancelOrderServiceFn({
        orderServiceId,
        actor: {
            id: req.user.id,
            role: 'company_admin',
            company_id: req.user.company_id
        },
        reason
    });

    res.status(200).json({
        success: true,
        message: 'Order service cancelled successfully',
        data: { orderService }
    });
});

