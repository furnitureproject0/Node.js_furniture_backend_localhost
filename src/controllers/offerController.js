import asyncHandler from 'express-async-handler';
import {
    createOffer as createOfferService,
    getOffersForOrderService as getOffersForOrderServiceService,
    getOfferById as getOfferByIdService,
    acceptOffer as acceptOfferService,
    rejectOffer as rejectOfferService,
    cancelOffer as cancelOfferService
} from '../services/offer/index.js';

export const createOffer = asyncHandler(async (req, res) => {
    const offer = await createOfferService({
        orderServiceId: req.params.orderServiceId,
        companyId: req.user.company_id,
        offerData: req.body
    });

    res.status(201).json({
        success: true,
        message: "Offer created successfully",
        data: { offer },
    });
});

export const getOffersForOrderService = asyncHandler(async (req, res) => {
    const offers = await getOffersForOrderServiceService({
        orderServiceId: req.params.orderServiceId,
        actor: {
            id: req.user.id,
            role: req.user.role,
            company_id: req.user.company_id
        }
    });

    res.status(200).json({
        success: true,
        message: 'Offers retrieved successfully',
        data: { offers }
    });
});

export const getOfferById = asyncHandler(async (req, res) => {
    const offer = await getOfferByIdService({
        offerId: req.params.offerId,
        actor: {
            id: req.user.id,
            role: req.user.role,
            company_id: req.user.company_id
        }
    });

    res.status(200).json({
        success: true,
        message: 'Offer retrieved successfully',
        data: { offer }
    });
});

export const acceptOffer = asyncHandler(async (req, res) => {
    await acceptOfferService({
        offerId: req.params.offerId,
        userId: req.user.id
    });

    res.status(200).json({
        success: true,
        message: 'Offer accepted successfully'
    });
});

export const rejectOffer = asyncHandler(async (req, res) => {
    await rejectOfferService({
        offerId: req.params.offerId,
        userId: req.user.id
    });

    res.status(200).json({
        success: true,
        message: 'Offer rejected successfully'
    });
});

export const cancelOffer = asyncHandler(async (req, res) => {
    await cancelOfferService({
        offerId: req.params.offerId,
        companyId: req.user.company_id
    });

    res.status(200).json({
        success: true,
        message: "Offer cancelled successfully",
    });
});
