import asyncHandler from 'express-async-handler';
import sequelize from '../config/database.js';
import AppError from '../utils/AppError.js';
import { assignCompaniesToUserService } from '../services/user-company/index.js'; // Adjust path

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

        // 👈 فضح تفاصيل الفاليديشن بتاعة الداتابيز
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errorMessages = error.errors.map(err => err.message).join(', ');
            throw new AppError(`DB Validation Error: ${errorMessages}`, 400);
        }

        throw new AppError(error.message || 'Failed to assign companies', error.statusCode || 500);
    }
});