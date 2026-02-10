import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { EmployeeCompany, Company, User } from '../models/index.js';
import { Op } from 'sequelize';
import { notifyCompanyAdminEmploymentAccepted, notifyCompanyAdminEmploymentRejected } from '../services/employeeNotificationService.js';

export const getMyEmployments = asyncHandler(async (req, res) => {
    const employeeId = req.user.id;
    const { page = 1, limit = 10, sort = '1', status } = req.query;

    const whereClause = { employee_id: employeeId };

    if (status) {
        whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const sortOrder = sort === '0' ? 'ASC' : 'DESC';

    const { count, rows: employments } = await EmployeeCompany.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Company,
                attributes: ['id', 'name', 'email', 'logo']
            }
        ],
        order: [['createdAt', sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });

    res.status(200).json({
        success: true,
        message: 'Employments retrieved successfully',
        data: {
            employments,
        },
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        }
    });
});

// Accept employment
export const acceptEmployment = asyncHandler(async (req, res) => {
    const { employmentId } = req.params;
    const employeeId = req.user.id;

    const employment = await EmployeeCompany.findOne({
        where: {
            id: employmentId,
            employee_id: employeeId
        },
        include: [
            {
                model: Company,
                attributes: ['id', 'name']
            }
        ]
    });

    if (!employment) {
        throw new AppError('Employment not found', 404);
    }

    // Verify the employment is pending
    if (employment.status !== 'pending') {
        throw new AppError('Only pending employments can be accepted', 400);
    }

    // Update employment status to active
    await employment.update({ status: 'active' });

    // Send notification to company admin
    try {
        await notifyCompanyAdminEmploymentAccepted({
            companyId: employment.company_id,
            employmentId: employment.id,
            employeeName: req.user.name,
            companyName: employment.Company.name,
            employeeId
        });
    } catch (error) {
        console.error('Failed to send employment acceptance notification to company admin:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Employment accepted successfully',
        data: { employment }
    });
});

// Reject employment
export const rejectEmployment = asyncHandler(async (req, res) => {
    const { employmentId } = req.params;
    const employeeId = req.user.id;

    const employment = await EmployeeCompany.findOne({
        where: {
            id: employmentId,
            employee_id: employeeId
        },
        include: [
            {
                model: Company,
                attributes: ['id', 'name']
            }
        ]
    });

    if (!employment) {
        throw new AppError('Employment not found', 404);
    }

    // Verify the employment is pending
    if (employment.status !== 'pending') {
        throw new AppError('Only pending employments can be rejected', 400);
    }

    // Update employment status to rejected
    await employment.update({ status: 'rejected' });

    // Send notification to company admin
    try {
        await notifyCompanyAdminEmploymentRejected({
            companyId: employment.company_id,
            employmentId: employment.id,
            employeeName: req.user.name,
            companyName: employment.Company.name,
            employeeId
        });
    } catch (error) {
        console.error('Failed to send employment rejection notification to company admin:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Employment rejected successfully',
        data: { employment }
    });
});
