import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { getAllServices, createService, updateService, activateService, deactivateService, softDeleteService, retrieveTrashedService, deleteService } from '../services/service/index.js'

export const getServices = asyncHandler(async (req, res) => {
    const { search = '', page = 1, limit = 10, ...filters } = req.query;
    
    const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    };
    const result = await getAllServices(filters, search, pagination, req.user);
    res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: result
    });
});

export const createNewService = asyncHandler(async (req, res) => {
    const service = await createService(req.body);
    res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: service
    });
});

export const updateServiceById = asyncHandler(async (req, res) => {
    const service = await updateService(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: service
    });
});

export const activeServiceById = asyncHandler(async (req, res) => {
    const result = await activateService(req.params.id);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            service_id: result.service_id
        }
    });
});

export const deactiveServiceById = asyncHandler(async (req, res) => {
    const result = await deactivateService(req.params.id);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            service_id: result.service_id
        }
    });
});

export const trashServiceById = asyncHandler(async (req, res) => {
    const result = await softDeleteService(req.params.id);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            service_id: result.service_id
        }
    });
});

export const retrieveServiceById = asyncHandler(async (req, res) => {
    const service = await retrieveTrashedService(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Service Retrieved successfully',
        data: service
    });
});

export const deleteServiceById = asyncHandler(async (req, res) => {
    const result = await deleteService(req.params.id);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            service_id: result.service_id
        }
    });
});