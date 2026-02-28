import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { getAllOrders, createOrderService, updateOrderService } from '../services/order-v2/index.js';
import sequelize from '../config/database.js';
import { getUser } from '../services/user/index.js';
import { cancelOrder } from '../services/order/index.js';
import { getCompanyAdmins } from '../services/company/index.js'; 
import { createNotification, sendNotification } from '../utils/notifications.js';


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

        const order = await createOrderService(req.body, { transaction });

        const companyIdsSet = new Set();
        if (order.company_id) companyIdsSet.add(order.company_id);

        if (order.orderServices && order.orderServices.length > 0) {
            order.orderServices.forEach(service => {
                if (service.company_id) companyIdsSet.add(service.company_id);
            });
        }

        const uniqueCompanyIds = Array.from(companyIdsSet);

        let notification = [];

        if (uniqueCompanyIds.length > 0) {
            const adminUserIds = await getCompanyAdmins(uniqueCompanyIds, { transaction });

            if (adminUserIds.length > 0) {
                const adminNotification = await createNotification({
                    title: 'New Order Assigned',
                    message: `A new order (#${order.id}) has been assigned to your company. Please review the details.`,
                    type: 'order',
                    actor_id: req.user.id, 
                    recipients: adminUserIds,
                    payload: { 
                        order_id: order.id, 
                        // link: `/orders/${order.id}` 
                    }
                }, { transaction });
                if (adminNotification) {
                    notification.push(adminNotification);
                }
            }
        }

        if (order.client_id) {
            const clientNotification = await createNotification({
                title: 'Order Created',
                message: `Your order (#${order.id}) has been created successfully. Please check the details.`,
                type: 'order',
                actor_id: req.user.id, 
                recipients: [order.client_id], 
                payload: { order_id: order.id }
            }, { transaction });
            notification.push(clientNotification);
        }
        await transaction.commit();

        if (notification && notification.length > 0) {
            await sendNotification(notification);
        }

        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            data: order
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

        const companyIdsSet = new Set();
        if (updatedOrder.company_id) companyIdsSet.add(updatedOrder.company_id);

        if (updatedOrder.orderServices && updatedOrder.orderServices.length > 0) {
            updatedOrder.orderServices.forEach(service => {
                if (service.company_id) companyIdsSet.add(service.company_id);
            });
        }

        const uniqueCompanyIds = Array.from(companyIdsSet);
        const notifications = []; 

        if (uniqueCompanyIds.length > 0) {
            const adminUserIds = await getCompanyAdmins(uniqueCompanyIds, { transaction });

            if (adminUserIds.length > 0) {
                notifications.push(await createNotification({
                    title: 'Order Updated',
                    message: `Order (#${updatedOrder.id}) assigned to your company has been updated by administration.`,
                    type: 'order',
                    actor_id: req.user.id, 
                    recipients: adminUserIds,
                    payload: { order_id: updatedOrder.id }
                }, { transaction }));
            }
        }

        if (updatedOrder.client_id) {
            notifications.push(await createNotification({
                title: 'Order Updated',
                message: `Your order (#${updatedOrder.id}) has been updated. Please check the new details.`,
                type: 'order',
                actor_id: req.user.id, 
                recipients: [updatedOrder.client_id], 
                payload: { order_id: updatedOrder.id }
            }, { transaction }));
        }

        await transaction.commit();

        for (const notification of notifications) {
            if (notification) await sendNotification(notification);
        }

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

        const companyIdsSet = new Set();
        if (cancelledOrder.company_id) companyIdsSet.add(cancelledOrder.company_id);

        if (cancelledOrder.orderServices && cancelledOrder.orderServices.length > 0) {
            cancelledOrder.orderServices.forEach(service => {
                if (service.company_id) companyIdsSet.add(service.company_id);
            });
        }

        const uniqueCompanyIds = Array.from(companyIdsSet);
        const notifications = [];

        if (uniqueCompanyIds.length > 0) {
            const adminUserIds = await getCompanyAdmins(uniqueCompanyIds, { transaction });

            if (adminUserIds.length > 0) {
                notifications.push(await createNotification({
                    title: 'Order Cancelled',
                    message: `Order (#${cancelledOrder.id}) assigned to your company has been cancelled. Reason: ${reason || 'Cancelled by admin'}.`,
                    type: 'order',
                    actor_id: req.user.id, 
                    recipients: adminUserIds,
                    payload: { order_id: cancelledOrder.id }
                }, { transaction }));
            }
        }

        if (cancelledOrder.client_id) {
            notifications.push(await createNotification({
                title: 'Order Cancelled',
                message: `We're sorry, your order (#${cancelledOrder.id}) has been cancelled. Reason: ${reason || 'Cancelled by admin'}.`,
                type: 'order',
                actor_id: req.user.id, 
                recipients: [cancelledOrder.client_id],
                payload: { order_id: cancelledOrder.id }
            }, { transaction }));
        }

        await transaction.commit();

        for (const notification of notifications) {
            if (notification) await sendNotification(notification);
        }

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