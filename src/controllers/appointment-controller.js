'use strict';

import { createAppointmentService, updateAppointmentService, getAllAppointmentsService, getAppointmentByIdService } from '../services/appointment/index.js';
import AppError from '../utils/AppError.js';

export const createAppointment = async (req, res, next) => {
    try {
        const appointment = await createAppointmentService(req.body);

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: appointment
        });
    } catch (err) {
        throw new AppError(err.message, err.statusCode || 500);
    }
};

export const updateAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const appointment = await updateAppointmentService(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Appointment updated successfully',
            data: appointment
        });
    } catch (err) {
        throw new AppError(err.message, err.statusCode || 500);
    }
};

export const getAllAppointments = async (req, res, next) => {
    try {
        const { search, page, limit, ...filters } = req.query;
        const pagination = { page, limit };
        const user = req.user; // Assuming you have authentication middleware setting req.user

        const result = await getAllAppointmentsService(filters, search, pagination, user);

        res.status(200).json({
            success: true,
            message: 'Appointments retrieved successfully',
            data: result.appointments,
            meta: result.pagination
        });
    } catch (err) {
        throw new AppError(err.message, err.statusCode || 500);
    }
};

export const getAppointmentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const appointment = await getAppointmentByIdService(id);

        res.status(200).json({
            success: true,
            message: 'Appointment retrieved successfully',
            data: appointment
        });
    } catch (err) {
        throw new AppError(err.message, err.statusCode || 500);
    }
};