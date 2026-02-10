import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { getClientOrders, getClientOrderById } from './client.order.controller.js'
import { getSiteAdminOrders, getSiteAdminOrderById } from './siteAdminOrderController.js'
import { getCompanyOrderById, getCompanyOrders } from './company-admin.order.controller.js'

export const getOrders = asyncHandler(async (req, res) => {
    const role = req.user.role;
    switch (role) {
        case 'client':
            return getClientOrders(req, res);
        case 'site_admin':
            return getSiteAdminOrders(req, res);
        case 'company_admin':
        case 'company_secretary':
            return getCompanyOrders(req, res);
    }
});

export const getOrderById = asyncHandler(async (req, res) => {
    const role = req.user.role;
    switch (role) {
        case 'client':
            return getClientOrderById(req, res);
        case 'site_admin':
            return getSiteAdminOrderById(req, res);
        case 'company_admin':
        case 'company_secretary':
            return getCompanyOrderById(req, res);
    }
})