'use strict';

import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { addVehicle, updateVehicle } from '../services/vehicle/index.js';

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

export const editVehicle = asyncHandler(async (req, res) => {
    const vehicleId = req.params.id;
    try {
        const updatedVehicle = await updateVehicle(vehicleId, req.body);
        res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            data: {
                vehicle: updatedVehicle
            }
        });
    } catch (error) {
        throw new AppError(error.message || 'Failed to update vehicle', error.statusCode || 500);
    }
});