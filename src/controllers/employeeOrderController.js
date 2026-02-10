import { OfferEmployee, Offer, OrderService, Order, Service, Company, Location } from '../models/index.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';

// Get all assignments for logged in employee
export const getMyAssignments = asyncHandler(async (req, res) => {
    const assignments = await OfferEmployee.findAll({
        where: { employee_id: req.user.id },
        attributes: { exclude: ['offer_id', 'employee_id'] },
        include: [{
            model: Offer,
            as: 'offer',
            include: [
                {
                    model: Company,
                    as: 'company',
                    attributes: ['id', 'name', 'logo']
                },
                {
                    model: OrderService,
                    as: 'orderService',
                    include: [
                        {
                            model: Service,
                            as: 'service',
                            attributes: ['id', 'name', 'description']
                        },
                        {
                            model: Order,
                            as: 'order',
                            exclude: ['location_id', 'destination_location_id'],
                            inluce: [
                                { model: Location, as: 'location' },
                                { model: Location, as: 'destination_location' }
                            ]
                        }
                    ]
                }
            ]
        }]
    });

    res.status(200).json({
        success: true,
        message: 'Your assignments retrieved successfully',
        data: {
            assignments
        }
    });
});

// Accept an offer assignment
export const acceptAssignment = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const employeeId = req.user.id;

    const assignment = await OfferEmployee.findOne({
        where: {
            offer_id: offerId,
            employee_id: employeeId
        }
    });

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    if (assignment.status !== 'pending') {
        throw new AppError('Assignment cannot be accepted in its current status', 400);
    }

    assignment.status = 'accepted';
    await assignment.save();

    res.status(200).json({
        success: true,
        message: 'Assignment accepted successfully',
        data: {
            assignment
        }
    });
});

// Reject an offer assignment
export const rejectAssignment = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const employeeId = req.user.id;

    const assignment = await OfferEmployee.findOne({
        where: {
            offer_id: offerId,
            employee_id: employeeId
        }
    });

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    if (assignment.status !== 'pending') {
        throw new AppError('Assignment cannot be rejected in its current status', 400);
    }

    assignment.status = 'rejected';
    await assignment.save();

    res.status(200).json({
        success: true,
        message: 'Assignment rejected successfully',
        data: {
            assignment
        }
    });
});
