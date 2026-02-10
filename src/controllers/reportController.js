import asyncHandler from 'express-async-handler';
import { Report, ReportEmployee, Transaction, OrderService, User, Offer, OrderTimeline, Service } from '../models/index.js';
import AppError from '../utils/AppError.js';
import sequelize from '../config/database.js';
import {
    checkReportAccessPermission,
    validateEmployeesInAcceptedOffer,
    validateReportTimingAfterOffer,
    validateSingleReportPerOrderService
} from '../services/reportService.js';
import {
    notifyCompanyAdminReportCreated,
    notifyCompanyAdminReportUpdated
} from '../services/reportNotificationService.js';
import { updateOrderStatusBasedOnServices } from '../services/order/index.js';


export const createReport = asyncHandler(async (req, res) => {
    const { orderServiceId } = req.params;
    const userId = req.user.id;

    const offer = await Offer.findOne({
        where: {
            order_service_id: orderServiceId,
            status: 'accepted'
        }
    });

    if (!offer) {
        throw new AppError('No accepted offer found for this order service. Reports can only be created after an offer is accepted.', 400);
    }

    await checkReportAccessPermission(userId, orderServiceId, offer);

    await validateSingleReportPerOrderService(orderServiceId);

    // Validate that current time is after the offer's scheduled time
    // await validateReportTimingAfterOffer(orderServiceId);

    const { transactions, employee_hours, ...reportData } = req.body;

    // Validate that all employees are part of the accepted offer
    if (employee_hours && employee_hours.length > 0) {
        const employeeIds = employee_hours.map(eh => eh.employee_id);
        await validateEmployeesInAcceptedOffer(offer, employeeIds);
    }

    const report = await sequelize.transaction(async (t) => {
        // Get order service with service name for timeline
        const orderService = await OrderService.findByPk(orderServiceId, {
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name']
                }
            ],
            transaction: t
        });

        const newReport = await Report.create({
            order_service_id: orderServiceId,
            created_by: userId,
            expected_amount: offer.hourly_rate * reportData.numofHours,
            ...reportData
        }, { transaction: t });

        await Transaction.create({
            transaction_type: 'order_payment',
            company_id: offer.company_id,
            report_id: newReport.id,
            payment_method: reportData.payment_method,
            name: 'Order Payment',
            amount: reportData.paid_amount,
            description: 'Payment for order',
            transaction_date: new Date(),
            status: 'completed'
        }, { transaction: t });


        if (employee_hours && employee_hours.length > 0) {
            const employeeHoursData = employee_hours.map(eh => ({
                report_id: newReport.id,
                employee_id: eh.employee_id,
                hours: eh.hours
            }));

            await ReportEmployee.bulkCreate(employeeHoursData, { transaction: t });
        }

        if (transactions && transactions.length > 0) {
            const transactionsData = transactions.map(txn => ({
                report_id: newReport.id,
                transaction_type: 'order_expense',
                company_id: offer.company_id,
                ...txn,
                transaction_date: new Date(),
                status: 'completed'
            }));

            await Transaction.bulkCreate(transactionsData, { transaction: t });
        }

        // Update OrderService status to completed
        await orderService.update(
            { status: 'completed' },
            { transaction: t }
        );

        // Create timeline entry for service completion
        await OrderTimeline.create({
            order_id: orderService.order_id,
            status: 'service_completed',
            message: `Service "${orderService.service.name}" has been completed`
        }, { transaction: t });

        // Update order status based on all services
        await updateOrderStatusBasedOnServices(orderService.order_id, t);

        // Fetch the complete report with associations
        await newReport.reload({
            include: [
                {
                    model: OrderService,
                    as: 'orderService'
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: ReportEmployee,
                    as: 'employeeHours',
                    include: [{
                        model: User,
                        as: 'employee',
                        attributes: ['id', 'name', 'email']
                    }]
                },
                {
                    model: Transaction,
                    as: 'transactions',
                    where: { transaction_type: 'order_expense' },
                    required: false
                }
            ],
            transaction: t
        });

        return { newReport, orderService };
    });

    // Send notification to company admin (non-blocking)
    const orderServiceForNotification = await OrderService.findByPk(orderServiceId, {
        attributes: ['company_id']
    });

    if (orderServiceForNotification?.company_id) {
        notifyCompanyAdminReportCreated({
            orderServiceId,
            companyId: orderServiceForNotification.company_id,
            reportId: report.newReport.id,
            createdByName: req.user.name || 'Team member'
        }).catch(err => console.error('Notification error:', err));
    }

    res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: { report: report.newReport }
    });
});


export const getReportForOrderService = asyncHandler(async (req, res) => {
    const { orderServiceId } = req.params;

    // Verify order service exists
    const orderService = await OrderService.findByPk(orderServiceId);
    if (!orderService) {
        throw new AppError('Order service not found', 404);
    }

    // Fetch the single report for this order service
    const report = await Report.findOne({
        where: { order_service_id: orderServiceId },
        include: [
            {
                model: OrderService,
                as: 'orderService'
            },
            {
                model: User,
                as: 'createdBy',
                attributes: ['id', 'name', 'email']
            },
            {
                model: ReportEmployee,
                as: 'employeeHours',
                include: [{
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'name', 'email']
                }]
            },
            {
                model: Transaction,
                as: 'transactions',
                where: { transaction_type: 'order_expense' },
                required: false
            }
        ]
    });

    if (!report) {
        return res.status(404).json({
            success: false,
            message: 'No report found for this order service'
        });
    }


    res.status(200).json({
        success: true,
        message: 'Report retrieved successfully',
        data: { report }
    });
});


export const updateReport = asyncHandler(async (req, res) => {
    const { orderServiceId } = req.params;
    const userId = req.user.id;

    const report = await Report.findOne({
        where: { order_service_id: orderServiceId },
        include: [{
            model: OrderService,
            as: 'orderService'
        }]
    });

    if (!report) {
        throw new AppError('Report not found for this order service', 404);
    }

    // Get the accepted offer for permission check
    const offer = await Offer.findOne({
        where: {
            order_service_id: orderServiceId,
            status: 'accepted'
        }
    });

    // Check if user has permission to edit
    await checkReportAccessPermission(userId, orderServiceId, offer);

    const { transactions, employee_hours, ...reportData } = req.body;

    // Validate employees if provided
    if (employee_hours && employee_hours.length > 0) {
        const employeeIds = employee_hours.map(eh => eh.employee_id);
        await validateEmployeesInAcceptedOffer(offer, employeeIds);
    }

    // Perform all updates in a transaction
    await sequelize.transaction(async (t) => {
        // Update report basic data
        await report.update(reportData, { transaction: t });

        // Update employee hours if provided
        if (employee_hours !== undefined) {
            // Delete existing employee hours
            await ReportEmployee.destroy({
                where: { report_id: report.id },
                transaction: t
            });

            // Create new employee hours if provided
            if (employee_hours.length > 0) {
                const employeeHoursData = employee_hours.map(eh => ({
                    report_id: report.id,
                    employee_id: eh.employee_id,
                    hours: eh.hours
                }));
                await ReportEmployee.bulkCreate(employeeHoursData, { transaction: t });
            }
        }

        // Update order expense transactions if provided
        if (transactions !== undefined) {
            // Delete existing order expense transactions
            await Transaction.destroy({
                where: {
                    report_id: report.id,
                    transaction_type: 'order_expense'
                },
                transaction: t
            });

            // Create new order expense transactions if provided
            if (transactions.length > 0) {
                const transactionsData = transactions.map(txn => ({
                    report_id: report.id,
                    transaction_type: 'order_expense',
                    ...txn,
                    transaction_date: new Date(),
                    status: 'completed'
                }));
                await Transaction.bulkCreate(transactionsData, { transaction: t });
            }
        }

        // Update order payment transaction if paid_amount changed
        if (reportData.paid_amount !== undefined || reportData.payment_method !== undefined) {
            const orderPaymentTransaction = await Transaction.findOne({
                where: {
                    report_id: report.id,
                    transaction_type: 'order_payment'
                },
                transaction: t
            });

            if (orderPaymentTransaction) {
                // Update existing order payment
                const updatePaymentData = {};
                if (reportData.paid_amount !== undefined) {
                    updatePaymentData.amount = reportData.paid_amount;
                }
                if (reportData.payment_method !== undefined) {
                    updatePaymentData.payment_method = reportData.payment_method;
                }
                await orderPaymentTransaction.update(updatePaymentData, { transaction: t });
            }
        }
    });

    // Fetch updated report with associations
    const updatedReport = await Report.findOne({
        where: { order_service_id: orderServiceId },
        include: [
            {
                model: OrderService,
                as: 'orderService'
            },
            {
                model: User,
                as: 'createdBy',
                attributes: ['id', 'name', 'email']
            },
            {
                model: ReportEmployee,
                as: 'employeeHours',
                include: [{
                    model: User,
                    as: 'employee',
                    attributes: ['id', 'name', 'email']
                }]
            },
            {
                model: Transaction,
                as: 'transactions',
                where: { transaction_type: 'order_expense' },
                required: false
            }
        ],
    });

    // Send notification to company admin (non-blocking)
    if (report.orderService?.company_id) {
        notifyCompanyAdminReportUpdated({
            orderServiceId,
            companyId: report.orderService.company_id,
            reportId: report.id,
            updatedByName: req.user.name || 'Team member'
        }).catch(err => console.error('Notification error:', err));
    }

    res.status(200).json({
        success: true,
        message: 'Report updated successfully',
        data: { report: updatedReport }
    });
});

