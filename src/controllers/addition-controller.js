import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { getAllAdditions, createAddition, updateAddition } from '../services/addition/index.js';

export const getAdditions = asyncHandler(async (req, res) => {

    const { search = '', page = 1, limit = 10, ...filters } = req.query;

    const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    };
    const result = await getAllAdditions(filters, search, pagination, req.user);
    res.status(200).json({
        success: true,
        message: 'Additions retrieved successfully',
        data: result
    });
});

export const createNewAddition = asyncHandler(async (req, res) => {
    const addition = await createAddition(req.body);
    res.status(201).json({
        success: true,
        message: 'Addition created successfully',
        data: addition
    });
});

export const updateAdditionById = asyncHandler(async (req, res) => {
    const addition = await updateAddition(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Addition updated successfully',
        data: addition
    });
});