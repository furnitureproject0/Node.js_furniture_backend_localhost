import { User, Offer, OfferEmployee, EmployeeCompany, OrderService, Service, Company } from '../models/index.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import sequelize from '../config/database.js';
import {
    notifyEmployeeAssignedToOffer,
    notifyEmployeeAssignmentRevoked,
    notifyEmployeeMadeLeader,
    notifyEmployeeLeadershipRemoved
} from '../services/employeeNotificationService.js';

// Assign employee to offer
export const assignEmployeeToOffer = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const { employeeId } = req.body
    const companyId = req.user.company_id;

    // Check if offer exists and belongs to the company
    const offer = await Offer.findOne({
        where: {
            id: offerId,
            company_id: companyId
        },
        include: [
            {
                model: OrderService,
                as: 'orderService',
                include: [{ model: Service, as: 'service' }]
            },
            {
                model: Company,
                as: 'company',
            }
        ]
    });

    if (!offer) {
        throw new AppError('Offer not found', 404);
    }

    if (offer.status !== 'accepted') {
        throw new AppError('Offer is not accepted', 400);
    }

    // Check if employee  works for the company
    const employment = await EmployeeCompany.findOne({
        where: {
            company_id: companyId,
            employee_id: employeeId,
            status: 'active'
        }
    });

    if (!employment) {
        throw new AppError('Employee is not working for this company or there is no active employment', 404);
    }

    // Check if assignment already exists
    let existingAssignment = await OfferEmployee.findOne({
        where: {
            offer_id: offerId,
            employee_id: employeeId,
        }
    });
    let assignment;
    if (existingAssignment) {
        if (['pending', 'accepted'].includes(existingAssignment.status)) {
            throw new AppError(`Employee is already assigned to this offer, status: ${existingAssignment.status}`, 400);
        }
        // If rejected or cancelled, reassign
        existingAssignment.status = 'pending';
        await existingAssignment.save();
        assignment = existingAssignment;
    } else {
        assignment = await OfferEmployee.create({
            offer_id: offerId,
            employee_id: employeeId,
            status: 'pending'
        });
    }


    await notifyEmployeeAssignedToOffer({
        employeeId,
        offerId,
        assignmentId: assignment.id,
        serviceName: offer.orderService.service.name,
        companyName: offer.company.name
    });

    res.status(201).json({
        success: true,
        message: 'Employee assigned to offer successfully',
        data: { assignment }
    });
});

// Revoke employee assignment
export const revokeAssignment = asyncHandler(async (req, res) => {
    const { offerId, assignmentId } = req.params;
    const companyId = req.user.company_id;

    // Check if offer exists and belongs to the company
    const offer = await Offer.findOne({
        where: {
            id: offerId,
            company_id: companyId
        },
        include: [
            {
                model: OrderService,
                as: 'orderService',
                include: [{ model: Service, as: 'service' }]
            },
            {
                model: Company,
                as: 'company',
            }
        ]
    });

    if (!offer) {
        throw new AppError('Offer not found or does not belong to your company', 404);
    }

    // Find and update assignment
    const assignment = await OfferEmployee.findOne({
        where: {
            id: assignmentId,
            offer_id: offerId
        }
    });

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    assignment.status = 'cancelled';
    await assignment.save();

    // Send notification to employee
    try {
        await notifyEmployeeAssignmentRevoked({
            employeeId,
            offerId,
            assignmentId: assignment.id,
            serviceName: offer.orderService?.service?.name,
            companyName: offer.company?.name
        });
    } catch (error) {
        console.error('Failed to send revocation notification to employee:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Assignment revoked successfully',
        data: {
            assignment
        }
    });
});

// Get all assignments for an offer
export const getOfferAssignments = asyncHandler(async (req, res) => {
    const { offerId } = req.params;
    const companyId = req.user.company_id;

    // Check if offer exists and belongs to the company
    const offer = await Offer.findOne({
        where: {
            id: offerId,
            company_id: companyId
        }
    });

    if (!offer) {
        throw new AppError('Offer not found or does not belong to your company', 404);
    }

    // Get all assignments with employee details
    const assignments = await OfferEmployee.findAll({
        where: { offer_id: offerId },
        include: [{
            model: User,
            as: 'employee',
        }]
    });

    res.status(200).json({
        success: true,
        message: 'Offer assignments retrieved successfully',
        data: {
            assignments
        }
    });
});

export const makeLeader = asyncHandler(async (req, res) => {
    const { offerId, employeeId } = req.params;
    const companyId = req.user.company_id;

    // Check if offer exists and belongs to the company
    const offer = await Offer.findOne({
        where: { id: offerId, company_id: companyId },
        include: [
            {
                model: OrderService,
                as: 'orderService',
                include: [{ model: Service, as: 'service' }]
            }
        ]
    });

    if (!offer) {
        throw new AppError("Offer not found", 404);
    }

    // Check if employee is assigned to this offer
    const assignment = await OfferEmployee.findOne({
        where: { offer_id: offerId, employee_id: employeeId }
    });

    if (!assignment) {
        throw new AppError("Employee is not assigned to this offer", 404);
    }

    let previousLeader = null;

    await sequelize.transaction(async (t) => {
        const currentLeader = await OfferEmployee.findOne({
            where: { offer_id: offerId, is_leader: true },
            transaction: t
        });

        if (currentLeader && currentLeader.id !== assignment.id) {
            previousLeader = currentLeader;
            await currentLeader.update({ is_leader: false }, { transaction: t });
        }

        await assignment.update({ is_leader: true }, { transaction: t });
    });

    // Send notification to new leader
    try {
        await notifyEmployeeMadeLeader({
            employeeId,
            offerId,
            assignmentId: assignment.id,
            serviceName: offer.orderService?.service?.name
        });
    } catch (error) {
        console.error('Failed to send leader notification to employee:', error);
    }

    // Send notification to previous leader if exists
    if (previousLeader) {
        try {
            await notifyEmployeeLeadershipRemoved({
                employeeId: previousLeader.employee_id,
                offerId,
                assignmentId: previousLeader.id,
                serviceName: offer.orderService?.service?.name
            });
        } catch (error) {
            console.error('Failed to send leadership removal notification:', error);
        }
    }

    res.status(200).json({
        success: true,
        message: `Employee with id: ${employeeId} set as leader for offer ${offerId}`,
        data: { assignment }
    });
});