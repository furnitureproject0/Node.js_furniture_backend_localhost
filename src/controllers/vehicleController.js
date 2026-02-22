'use strict';

import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { addVehicle } from '../services/vehicle/index.js';

export const createVehicle = asyncHandler(async (req, res) => {
    try {
        const vehicle = await addVehicle(req.body);
        res.status(201).json({
            success: true,
            message: 'Vehicle created successfully',
            data: {
                vehicle: vehicle
            }
        });
    } catch (error) {
        throw new AppError(error.message || 'Failed to create vehicle', error.statusCode || 500);
    }
});