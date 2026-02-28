import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { getAllOrders, createOrderService, updateOrderService } from '../services/order-v2/index.js';
import sequelize from '../config/database.js';
import { getUser } from '../services/user/index.js';
import { cancelOrder } from '../services/order/index.js';


export const getOrders = asyncHandler(async (req, res) => {
    const { 
        search, 
        page, 
        limit, 
        status, 
        execution_date, 
        min_price, 
        max_price 
    } = req.query;
    
    const filters = { status, execution_date, min_price, max_price, type: 'order' }; // Ensure we only fetch orders, not offers or appointments
    const pagination = { page, limit };

    try {
        const result = await getAllOrders(filters, search, pagination);
        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: result.orders,
            meta: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                totalPages: result.pagination.totalPages,
                totalItems: result.pagination.totalItems
            }
        });
    } catch (error) {
        throw new AppError(error.message || 'Failed to retrieve orders', 500);
    }
});

export const adminCreateOrderForClient = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const user = await getUser({ email: req.body.email }, { transaction });

        req.body.client_id = user.id;

        const result = await createOrderService(req.body, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            data: result
        });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(error.message || 'Failed to create order', 500);
    }
});


export const adminUpdateOrderForClient = asyncHandler(async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {

        if (req.body.email) {
            const user = await getUser({ email: req.body.email }, { transaction });
            req.body.client_id = user.id;
        }

        const { id } = req.params; 
        const orderData = req.body; 

        const updatedOrder = await updateOrderService(id, orderData, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: updatedOrder
        });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(error.message || 'Failed to update order', 500);
    }
});

export const cancelOrderByAdmin = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;
        const cancelledOrder = await cancelOrder({
            orderId: id,
            userId: userId,
            userRole: userRole,
            reason: reason || 'Cancelled by user',
            options: {
                skipOwnershipCheck: ['super_admin', 'site_admin', 'company_admin', 'company_secretary'].includes(userRole)
            }
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                order_id: cancelledOrder.id,
                status: cancelledOrder.status,
                cancelled_at: new Date()
            }
        });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(error.message || 'Failed to cancel order', 500);
    }
});