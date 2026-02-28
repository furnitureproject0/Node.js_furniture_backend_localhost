import asyncHandler from 'express-async-handler';
import { createOffer, updateOffer, getOffersList } from '../services/offer-v2/index.js';
import sequelize from '../config/database.js';
import { getUser } from '../services/user/index.js';
import AppError from '../utils/AppError.js';
import { cancelOrder } from '../services/order/index.js';


// Get all offers
export const getOffers = asyncHandler(async (req, res) => {
    const { search, page, limit, status, execution_date } = req.query;
    const filters = { status, execution_date };
    const pagination = { page, limit };

    const result = await getOffersList(filters, search, pagination);
    
    res.status(200).json({
        success: true,
        data: result.orders,
        meta: result.pagination
    });
});

// Admin creates offer for client
export const adminCreateOfferForClient = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        if (req.body.email) {
            const user = await getUser({ email: req.body.email }, { transaction });
            req.body.client_id = user.id;
        }

        // Call our specialized offer service
        const result = await createOffer(req.body, { transaction });

        await transaction.commit();
        res.status(201).json({
            success: true,
            message: 'Offer created successfully',
            data: result
        });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(error.message || 'Failed to create offer', 500);
    }
});

// Update offer
export const adminUpdateOffer = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        
        const result = await updateOffer(id, req.body, { transaction });

        await transaction.commit();
        res.status(200).json({
            success: true,
            message: 'Offer updated successfully',
            data: result
        });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(error.message || 'Failed to update offer', 500);
    }
});

export const cancelOfferByAdmin = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params; // ده الـ ID بتاع الأوردر اللي نوعه Offer
        const { reason } = req.body;

        const userId = req.user.id;
        const userRole = req.user.role;

        const targetOrder = await Order.findByPk(id, { transaction });

        if (!targetOrder) {
            throw new AppError('Record not found', 404);
        }
        
        if (targetOrder.type !== 'offer') {
            throw new AppError('Invalid operation: This ID belongs to an order, not an offer', 400);
        }

        const cancelledOffer = await cancelOrder({
            orderId: id,
            userId: userId,
            userRole: userRole,
            reason: reason || 'Offer cancelled by admin',
            options: {
                transaction, 
                skipOwnershipCheck: ['super_admin', 'site_admin', 'company_admin', 'company_secretary'].includes(userRole)
            }
        });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Offer cancelled successfully',
            data: {
                offer_id: cancelledOffer.id,
                status: cancelledOffer.status,
                cancelled_at: new Date()
            }
        });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(error.message || 'Failed to cancel offer', 500);
    }
});