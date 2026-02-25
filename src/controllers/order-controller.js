import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { createOrderService } from '../services/order-v2/index.js';
import sequelize from '../config/database.js';

export const adminCreateOrderForClient = asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();

    const result = createOrderService(req.body, { transaction });

    
});