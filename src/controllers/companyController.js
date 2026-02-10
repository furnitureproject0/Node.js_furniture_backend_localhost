import { Company, Phone, CompanySocialMedia, Service, CompanyService, Transaction } from '../models/index.js';
import sequelize from '../config/database.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import { saveLogo } from '../utils/image.js';
import path from 'path';
import fs from 'fs/promises';
import { Op, fn, col, literal, Sequelize } from 'sequelize';


export const getAllCompanies = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page)
    limit = parseInt(limit)
    const offset = (page - 1) * limit;

    const { rows: companies, count } = await Company.findAndCountAll({
        include: [
            {
                model: Phone,
                as: 'phones',
            },
            {
                model: CompanySocialMedia,
                as: 'socialMedia'
            },
            {
                model: Service,
                as: 'services',
                through: { attributes: [] }
            }
        ],
        limit: limit,
        offset: offset,
        distinct: true
    });

    res.status(200).json({
        success: true,
        message: "Companies retrieved successfully",
        data: {
            companies,
            pagination: {
                page: page,
                limit: limit,
                totalPages: Math.ceil(count / limit),
                totalItems: count
            }
        }
    });
});


export const getCompanyById = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id, {
        include: [
            {
                model: Phone,
                as: 'phones',
            },
            {
                model: CompanySocialMedia,
                as: 'socialMedia'
            },
            {
                model: Service,
                as: 'services',
                through: { attributes: [] }
            }
        ]
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Company retrieved successfully',
        data: { company }
    });
});


export const createCompany = asyncHandler(async (req, res) => {
    const { phones, socialMedia, services, ...companyData } = req.body;

    const result = await sequelize.transaction(async (t) => {
        // Create company
        const company = await Company.create(companyData, { transaction: t });

        // Save logo if provided
        if (req.file && req.file.buffer) {
            const filename = await saveLogo(req.file.buffer, { companyId: company.id });
            await company.update({ logo: `/uploads/${filename}` }, { transaction: t });
        }

        // Add phones if provided
        if (phones && Array.isArray(phones) && phones.length > 0) {
            const phoneRecords = phones.map((p) => ({
                phone: p,
                owner_id: company.id,
                owner_type: 'Company'
            }));
            await Phone.bulkCreate(phoneRecords, { transaction: t });
        }

        // Add social media if provided
        if (socialMedia && Array.isArray(socialMedia) && socialMedia.length > 0) {
            const socialMediaRecords = socialMedia.map((s) => ({
                ...s,
                company_id: company.id
            }));
            await CompanySocialMedia.bulkCreate(socialMediaRecords, { transaction: t });
        }

        // Add service associations if provided
        if (services && Array.isArray(services) && services.length > 0) {
            const companyServiceRecords = services.map(serviceId => ({
                company_id: company.id,
                service_id: serviceId
            }));
            await CompanyService.bulkCreate(companyServiceRecords, { transaction: t });
        }

        // Reload company with associations
        await company.reload({
            include: [
                { model: Phone, as: 'phones' },
                { model: CompanySocialMedia, as: 'socialMedia' },
                { model: Service, as: 'services', through: { attributes: [] } }
            ],
            transaction: t
        });

        return company;
    });

    res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: { company: result }
    });
});


export const updateCompany = asyncHandler(async (req, res) => {
    const { phones, socialMedia, services, ...companyData } = req.body;

    const company = await Company.findByPk(req.params.id);

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.role !== 'super_admin' && company.id !== req.user.company_id) {
        throw new AppError('Not authorized to update this company', 403);
    }

    // Use a transaction for safety
    await sequelize.transaction(async (t) => {
        await company.update(companyData, { transaction: t });

        // Update logo if provided and remove old logo if exists
        if (req.file && req.file.buffer) {
            // Remove old logo
            if (company.logo && company.logo.startsWith('/uploads/')) {
                try {
                    const oldLogoPath = path.resolve(process.cwd(), company.logo.replace(/^\/+/, ''));
                    await fs.access(oldLogoPath);
                    await fs.unlink(oldLogoPath);
                } catch (err) {
                    // Ignore if file doesn’t exist
                    if (err.code !== 'ENOENT') console.error('Error deleting old logo:', err);
                }
            }
            const filename = await saveLogo(req.file.buffer, { companyId: company.id });
            await company.update({ logo: `/uploads/${filename}` }, { transaction: t });
        }

        // Phones update
        if (Array.isArray(phones)) {
            // Remove old phones
            await Phone.destroy({
                where: { owner_id: company.id, owner_type: 'Company' },
                transaction: t
            });

            if (phones.length > 0) {
                const phoneRecords = phones.map((p) => ({
                    phone: p,
                    owner_id: company.id,
                    owner_type: 'Company'
                }));
                await Phone.bulkCreate(phoneRecords, { transaction: t });
            }
        }

        // Social media update
        if (Array.isArray(socialMedia)) {
            // Remove old social media records
            await CompanySocialMedia.destroy({
                where: { company_id: company.id },
                transaction: t
            });

            if (socialMedia.length > 0) {
                const socialMediaRecords = socialMedia.map((s) => ({
                    ...s,
                    company_id: company.id
                }));
                await CompanySocialMedia.bulkCreate(socialMediaRecords, { transaction: t });
            }
        }

        // Services update
        if (Array.isArray(services)) {
            // Remove old service associations
            await CompanyService.destroy({
                where: { company_id: company.id },
                transaction: t
            });

            if (services.length > 0) {
                const companyServiceRecords = services.map(serviceId => ({
                    company_id: company.id,
                    service_id: serviceId
                }));
                await CompanyService.bulkCreate(companyServiceRecords, { transaction: t });
            }
        }

        // Reload company with associations
        await company.reload({
            include: [
                { model: Phone, as: 'phones' },
                { model: CompanySocialMedia, as: 'socialMedia' },
                { model: Service, as: 'services', through: { attributes: [] } }
            ],
            transaction: t
        });
    });

    res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: { company }
    });
});


export const suspendCompany = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (company.status === 'suspended') {
        throw new AppError('Company is already suspended', 400);
    }

    await company.update({ status: 'suspended' });

    res.status(200).json({
        success: true,
        message: 'Company suspended successfully',
        data: { company }
    });
});


export const activateCompany = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (company.status === 'active') {
        throw new AppError('Company is already active', 400);
    }

    await company.update({ status: 'active' });

    res.status(200).json({
        success: true,
        message: 'Company activated successfully',
        data: { company }
    });
});

const calculateStats = async (companyId, whereClause = {}) => {
    const stats = await Transaction.findAll({
        where: { company_id: companyId, status: 'completed', ...whereClause },
        attributes: [
            [fn('SUM', literal(`CASE WHEN transaction_type = 'order_payment' THEN amount ELSE 0 END`)), 'revenue'],
            [fn('SUM', literal(`CASE WHEN transaction_type IN ('order_expense', 'administrative_expense') THEN amount ELSE 0 END`)), 'expense']
        ],
        raw: true
    });

    const revenue = parseFloat(stats[0]?.revenue) || 0;
    const expense = parseFloat(stats[0]?.expense) || 0;
    const profit = revenue - expense;

    return { revenue, expense, profit };
};

const generateChartData = async (companyId, start, end, points) => {
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const intervalDays = Math.ceil(totalDays / points);
    console.log('------------------------')
    console.log('totalDays', totalDays)
    console.log('intervalDays', intervalDays)
    console.log('points', points)
    console.log('------------------------')

    points = Math.min(points, totalDays);

    const chartRows = await Transaction.findAll({
        where: {
            company_id: companyId,
            status: 'completed',
            transaction_date: { [Op.between]: [start, end] }
        },
        attributes: [
            [
                Sequelize.literal(`
                    DATE_ADD(
                        '${start.toISOString().split('T')[0]}',
                        INTERVAL FLOOR(DATEDIFF(transaction_date, '${start.toISOString().split('T')[0]}') / ${intervalDays}) * ${intervalDays} DAY
                    )
                `),
                'bucket_start'
            ],
            [fn('SUM', literal(`CASE WHEN transaction_type = 'order_payment' THEN amount ELSE 0 END`)), 'revenue'],
            [fn('SUM', literal(`CASE WHEN transaction_type IN ('order_expense', 'administrative_expense') THEN amount ELSE 0 END`)), 'expense']
        ],
        group: ['bucket_start'],
        order: [[literal('bucket_start'), 'ASC']],
        raw: true
    });

    return chartRows.map(row => ({
        label: row.bucket_start,
        revenue: parseFloat(row.revenue) || 0,
        expense: parseFloat(row.expense) || 0,
        profit: (parseFloat(row.revenue) || 0) - (parseFloat(row.expense) || 0)
    }));
};

export const getCompanyDashboard = asyncHandler(async (req, res) => {
    const { id: companyId } = req.params;
    const body = req.body || {};
    const { start_date, end_date, points = 15 } = body;

    const company = await Company.findByPk(companyId);
    if (!company) throw new AppError('Company not found', 404);

    if (req.user.role === 'company_admin' && req.user.company_id !== parseInt(companyId)) {
        throw new AppError('You are not authorized to view this company dashboard', 403);
    }

    if (start_date && end_date) {
        const start = new Date(start_date);
        const end = new Date(end_date);


        const [totalStats, periodStats, chartData] = await Promise.all([
            calculateStats(companyId),
            calculateStats(companyId, { transaction_date: { [Op.between]: [start, end] } }),
            generateChartData(companyId, start, end, points)
        ]);

        return res.status(200).json({
            success: true,
            message: 'Company dashboard data retrieved successfully',
            data: { total: totalStats, period: periodStats, chartData }
        });
    }

    const totalStats = await calculateStats(companyId);
    console.log(totalStats)
    return res.status(200).json({
        success: true,
        message: 'Company total statistics retrieved successfully',
        data: { total: totalStats }
    });
});