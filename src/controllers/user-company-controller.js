import asyncHandler from 'express-async-handler';
import sequelize from '../config/database.js';
import AppError from '../utils/AppError.js';
import { assignCompaniesToUserService, removeCompanyFromUserService, getAdminCompaniesService } from '../services/user-company/index.js'; 


export const getAdminCompanies = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, type } = req.query;

    if (type && !['internal', 'external'].includes(type)) {
        throw new AppError('Invalid company type. Must be either "internal" or "external"', 400);
    }

    const result = await getAdminCompaniesService(id, { type }, { page, limit });

    const messagePrefix = type ? `${type} ` : 'All ';

    res.status(200).json({
        success: true,
        message: `${messagePrefix}companies retrieved successfully`,
        data: result.companies,
        meta: result.pagination
    });
});

export const assignCompaniesToAdmin = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params; 
        const { assignments } = req.body; 

        if (!assignments || !Array.isArray(assignments)) {
            throw new AppError('Please provide an array of assignments', 400);
        }

        const newAssignments = await assignCompaniesToUserService(
            id, 
            assignments, 
            { transaction }
        );

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Companies successfully assigned to user',
            data: newAssignments 
        });

    } catch (error) {
        // if (transaction && !transaction.finished) {
        //     await transaction.rollback();
        // }
        // throw new AppError(error.message || 'Failed to assign companies', error.statusCode || 500);
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }

        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errorMessages = error.errors.map(err => err.message).join(', ');
            throw new AppError(`DB Validation Error: ${errorMessages}`, 400);
        }

        throw new AppError(error.message || 'Failed to assign companies', error.statusCode || 500);
    }
});

export const removeCompanyFromAdmin = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id, companyId } = req.params; 
        const { type } = req.query;

        if (!type || !['internal', 'external'].includes(type)) {
            throw new AppError('Please provide a valid assignment type (internal or external) in the query parameters', 400);
        }

        await removeCompanyFromUserService(id, companyId, type, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `Company assignment (${type}) removed successfully`
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        throw new AppError(error.message || 'Failed to remove company assignment', error.statusCode || 500);
    }
});