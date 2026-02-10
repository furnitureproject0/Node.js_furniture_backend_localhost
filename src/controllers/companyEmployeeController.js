import { Company, User, EmployeeCompany, Phone, Order, OrderService, OrderServiceAddition, OrderTimeline, Location, Service, Addition } from '../models/index.js';
import sequelize from '../config/database.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/sendEmail.js';
import { generateCompanyEmployeeWelcomeTemplate } from '../emailTemplates/companyEmployeeTemplate.js';
import { generateClientAccountTemplate } from '../emailTemplates/clientAccountTemplate.js';
import { generateOrderCreatedTemplate } from '../emailTemplates/orderCreatedTemplate.js';
import { generateRandomPassword } from '../utils/passwordGenerator.js';
import { createAndSendNotification } from '../utils/notifications.js';
import { validateServicesAndAdditions } from '../services/order/index.js';
import { saveOrderImages } from '../utils/image.js';
import { checkClientEmailSchema } from '../validation/company-employee-schema.js';
import jwt from 'jsonwebtoken';


export const getCompanyAdmin = asyncHandler(async (req, res) => {
    const admin = await User.findOne({
        where: {
            role: "company_admin",
            company_id: req.params.id
        },
        include: {
            model: Phone,
            as: "phones"
        }
    });

    if (!admin) {
        throw new AppError("No admin found for this company", 404);
    }

    res.status(200).json({
        success: true,
        message: 'Company admin retrieved successfully',
        data: { admin }
    });
});



export const createCompanyAdmin = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    // Check if company already has an admin
    const existingAdmin = await User.findOne({
        where: { company_id: company.id, role: 'company_admin' }
    });
    if (existingAdmin) {
        throw new AppError('Company already has an admin', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({
        where: { email: req.body.email }
    });

    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }

    const generatedPassword = generateRandomPassword();
    const phones = req.body.phones;

    let admin;
    await sequelize.transaction(async (t) => {
        const { phones: _phones, ...adminData } = req.body;

        // Create admin
        admin = await User.create({
            ...adminData,
            password: generatedPassword,
            role: 'company_admin',
            company_id: company.id,
            is_verified: true
        }, { transaction: t });

        // Create phones if provided
        if (phones && Array.isArray(phones)) {
            const phoneRecords = phones.map(phone => ({
                phone,
                owner_id: admin.id,
                owner_type: 'User'
            }));
            await Phone.bulkCreate(phoneRecords, { transaction: t });
        }
    });

    // Reload admin with phones
    await admin.reload({
        include: [{ model: Phone, as: 'phones' }]
    });

    // Send welcome email
    try {
        await sendEmail({
            to: admin.email,
            subject: `Welcome to ${company.name} - Admin Account Created`,
            html: generateCompanyEmployeeWelcomeTemplate({
                name: admin.name,
                email: admin.email,
                password: generatedPassword,
                role: admin.role,
                companyName: company.name
            })
        });
    } catch (error) {
        console.error('Failed to send admin welcome email:', error);
    }


    res.status(201).json({
        success: true,
        message: 'Company admin created successfully',
        data: { admin }
    });
});


export const updateCompanyAdmin = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    // Find the admin of this company
    const admin = await User.findOne({
        where: { company_id: company.id, role: 'company_admin' },
        include: [{ model: Phone, as: 'phones' }]
    });

    if (!admin) {
        throw new AppError('No admin found for this company', 404);
    }

    const { phones, ...updateData } = req.body;

    await sequelize.transaction(async (t) => {
        await admin.update(updateData, { transaction: t });

        if (phones) {
            await Phone.destroy({
                where: { owner_id: admin.id, owner_type: 'User' },
                transaction: t
            });

            if (Array.isArray(phones) && phones.length > 0) {
                const phoneRecords = phones.map(phone => ({
                    phone,
                    owner_id: admin.id,
                    owner_type: 'User'
                }));
                await Phone.bulkCreate(phoneRecords, { transaction: t });
            }
        }
    });

    await admin.reload({
        include: [{ model: Phone, as: 'phones' }]
    });

    res.status(200).json({
        success: true,
        message: 'Company admin updated successfully',
        data: { admin }
    });
});


// helper: check if user has permission to manage this company
const checkCompanyPermission = (user, companyId) => {
    return (
        user.role === 'super_admin' ||
        user.role === 'company_admin' && user.company_id === parseInt(companyId)
    );
};

// get all company employees
export const getCompanyEmployees = asyncHandler(async (req, res) => {
    let { role, page = 1, limit = 10, sort = 1, status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;
    sort = parseInt(sort)
    const sortOrder = String(sort) === 0 ? 'ASC' : 'DESC';

    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    checkCompanyPermission(req.user, company.id);

    // Find all employees through EmployeeCompany table
    const whereClause = {
        company_id: company.id,
    }
    if (status) {
        whereClause.status = status
    }

    const { rows: employments, count } = await EmployeeCompany.findAndCountAll({
        where: whereClause,
        include: [{
            model: User,
            where: role ? { role } : undefined,
            attributes: { exclude: ['password'] },
            include: [{
                model: Phone,
                as: 'phones'
            }]
        }],
        limit,
        offset,
        order: [['createdAt', sortOrder]]
    });

    res.status(200).json({
        success: true,
        message: 'Company employees retrieved successfully',
        data: {
            employments
        },
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalItems: count
        }
    });
});

// Add Employee to Company
export const addCompanyEmployee = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.company_id !== company.id) {
        throw new AppError('Not authorized to add employees to this company', 403);
    }

    const existingUser = await User.findOne({
        where: { email: req.body.email }
    });

    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }

    const { hourly_rate, currency, start_date, end_date, phones, ...userData } = req.body;

    // Generate random password
    const generatedPassword = generateRandomPassword();

    const result = await sequelize.transaction(async (t) => {
        const user = await User.create({
            ...userData,
            password: generatedPassword,
            is_verified: true,
        }, { transaction: t });

        if (phones && phones.length > 0) {
            await Phone.bulkCreate(
                phones.map(phoneNumber => ({
                    phone: phoneNumber,
                    owner_id: user.id,
                    owner_type: 'User'
                })),
                { transaction: t }
            );
        }

        const employmentData = {
            employee_id: user.id,
            company_id: company.id,
            start_date,
            end_date,
            hourly_rate: hourly_rate || null,
            currency: currency || 'CHF',
            status: 'active'
        };

        const employment = await EmployeeCompany.create(employmentData, { transaction: t });

        await user.reload({
            include: [
                { model: Phone, as: 'phones' },
                {
                    model: EmployeeCompany,
                    as: 'employments',
                }
            ],
            transaction: t
        });

        return user;
    });

    // Send welcome email
    try {
        await sendEmail({
            to: result.email,
            subject: `Welcome to ${company.name} - Employee Account Created`,
            html: generateCompanyEmployeeWelcomeTemplate({
                name: result.name,
                email: result.email,
                password: generatedPassword,
                role: result.role,
                companyName: company.name
            })
        });
    } catch (error) {
        console.error('Failed to send employee welcome email:', error);
    }

    res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        data: result
    });
});

// Create a client user for a company (by company_admin or company_secretary)
export const createCompanyClient = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.role !== 'site_admin' && req.user.company_id !== company.id) {
        throw new AppError('Not authorized to create clients for this company', 403);
    }

    // Email must be unique
    const existingUser = await User.findOne({
        where: { email: req.body.email }
    });

    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }

    const { phones, ...clientData } = req.body;

    // Generate random password
    const generatedPassword = generateRandomPassword();

    const client = await sequelize.transaction(async (t) => {
        const newClient = await User.create({
            ...clientData,
            password: generatedPassword,
            role: 'client',
            is_verified: true
        }, { transaction: t });

        if (phones && Array.isArray(phones) && phones.length > 0) {
            const phoneRecords = phones.map(phone => ({
                phone,
                owner_id: newClient.id,
                owner_type: 'User'
            }));
            await Phone.bulkCreate(phoneRecords, { transaction: t });
        }

        return newClient;
    });

    res.status(201).json({
        success: true,
        message: 'Client account created successfully',
        data: client
    });

    try {
        await sendEmail({
            to: client.email,
            subject: `Your account has been created`,
            html: generateClientAccountTemplate({
                name: client.name,
                email: client.email,
                password: generatedPassword,
                companyName: company.name
            })
        });
    } catch (error) {
        console.error('Failed to send client account email:', error);
    }


});

// Create an order for a client (by company_admin)
export const createOrderForClient = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.company_id !== company.id) {
        throw new AppError('Not authorized to create orders for this company', 403);
    }

    const { services, location, destination_location, email, ...orderData } = req.body;

    // Validate that client exists and is a client
    const client = await User.findOne({
        where: { email, role: 'client' }
    });

    if (!client) {
        throw new AppError('Client not found or invalid client ID', 404);
    }

    const result = await sequelize.transaction(async (t) => {
        // Validate services
        await validateServicesAndAdditions(services);

        const pickupLocation = await Location.create(location, { transaction: t });

        // Create destination location if provided
        let destinationLocation = null;
        if (destination_location) {
            destinationLocation = await Location.create(destination_location, { transaction: t });
        }

        // Create order
        const order = await Order.create({
            ...orderData,
            client_id: client.id,
            location_id: pickupLocation.id,
            destination_location_id: destinationLocation?.id || null
        }, { transaction: t });

        // create order serviceds and additions
        const orderServiceRecords = services.map(service => ({
            order_id: order.id,
            service_id: service.service_id,
            status: "assigned",
            company_id: company.id
        }))

        const createdOrderServices = await OrderService.bulkCreate(
            orderServiceRecords,
            { transaction: t }
        )

        const serviceIdToOrderServiceId = new Map();
        createdOrderServices.forEach(orderService => {
            serviceIdToOrderServiceId.set(orderService.service_id, orderService.id)
        })

        const additionsRecords = [];
        for (const { service_id, additions } of services) {
            if (!additions?.length) continue;

            const orderServiceId = serviceIdToOrderServiceId.get(service_id)

            for (const add of additions) {
                additionsRecords.push({
                    order_service_id: orderServiceId,
                    addition_id: add.addition_id,
                    note: add.note || null
                })
            }
        }

        if (additionsRecords.length) {
            await OrderServiceAddition.bulkCreate(additionsRecords, {
                transaction: t
            });
        }

        // Create initial timeline entry
        await OrderTimeline.create({
            order_id: order.id,
            status: "pending",
            message: `Order created by company admin (${company.name}) for client ${client.name}`
        }, { transaction: t });

        return order;
    });

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order: result }
    });

    // Handle image uploads if files are provided
    setImmediate(async () => {
        if (req.files && req.files.length > 0) {
            try {
                const imageFilenames = await saveOrderImages(req.files, { orderId: result.id });
                await Order.update({ images: imageFilenames }, { where: { id: result.id } })
            } catch (error) {
                console.error('Failed to save order images:', error);
                // Continue without images rather than failing the entire order
            }
        }

        const generateOrderAccessToken = (orderId, userId) => {
            return jwt.sign(
                { id: userId, orderId },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
        };

        const orderAccessToken = generateOrderAccessToken(result.id, client.id);
        const orderLink = `${process.env.CLIENT_URL}/client/order/${result.id}?token=${orderAccessToken}`;

        // Send order creation email to client
        try {
            await sendEmail({
                to: client.email,
                subject: `New Order Created - Order #${result.id}`,
                html: generateOrderCreatedTemplate({
                    clientName: client.name,
                    companyName: company.name,
                    orderId: result.id,
                    order: result,
                    orderLink: orderLink
                })
            });
        } catch (error) {
            console.error('Failed to send order creation email:', error);
        }

        // Send order creation notification to client
        try {
            await createAndSendNotification({
                user_id: client.id,
                title: 'New Order Created',
                message: `${company.name} has created a new order (#${result.id}) on your behalf.`,
                type: 'order',
                payload: {
                    order_id: result.id,
                    link: `/orders/${result.id}`
                }
            });

            // Notify site admins
            const siteAdmins = await User.findAll({ where: { role: 'site_admin' } });
            if (siteAdmins.length > 0) {
                await createAndSendNotification({
                    user_id: siteAdmins[0].id,
                    title: 'New Order Added',
                    message: `A new order #${result.id} has been created by ${company.name} for client ${client.name}.`,
                    type: 'order',
                    payload: {
                        order_id: result.id,
                        link: `/admin/orders/${result.id}`
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send order notifications:', error);
        }

    })
});

// Update employment data (rate, currency, startdate)
export const updateEmployment = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.company_id !== company.id) {
        throw new AppError('Not authorized to update employment for this company', 403);
    }

    const { employmentId } = req.params;

    const employment = await EmployeeCompany.findOne({
        where: { id: employmentId, company_id: company.id }
    });

    if (!employment) {
        throw new AppError('Employment record not found', 404);
    }

    if (employment.status !== 'pending') {
        throw new AppError(`Cannot update a ${employment.status} employment`, 403);
    }

    await employment.update(req.body);

    res.status(200).json({
        success: true,
        message: 'Employment updated successfully',
        data: { employment }
    });
});

// Create employment for existing user
export const createEmployment = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.company_id !== company.id) {
        throw new AppError('Not authorized to create employment for this company', 403);
    }
    console.log(req.body)
    const { email, hourly_rate, currency, start_date, end_date } = req.body;

    // Check if user exists with this email
    const user = await User.findOne({
        where: { email }
    });

    if (!user) {
        throw new AppError('User with this email does not exist', 404);
    }

    if (user.role !== 'worker' && user.role !== 'driver') {
        throw new AppError('User must be a worker or driver', 400);
    }

    // Check if there's already an active or pending employment for this user in this company
    const existingEmployment = await EmployeeCompany.findOne({
        where: {
            employee_id: user.id,
            company_id: company.id,
            status: ['active', 'pending']
        }
    });

    if (existingEmployment) {
        throw new AppError(`Cannot create employment. User already has a ${existingEmployment.status} employment with this company`, 400);
    }

    // Create employment with pending status
    const employment = await EmployeeCompany.create({
        employee_id: user.id,
        company_id: company.id,
        hourly_rate: hourly_rate || null,
        currency: currency || 'CHF',
        start_date: start_date || new Date(),
        end_date: end_date || null,
        status: 'pending'
    });

    // Reload with user details
    await employment.reload({
        include: [{
            model: User,
            attributes: { exclude: ['password'] },
            include: [{ model: Phone, as: 'phones' }]
        }]
    });

    // Send notification to employee
    try {
        await createAndSendNotification({
            user_id: user.id,
            title: 'New Employment Offer',
            message: `You have received a new employment offer from ${company.name}. Please review and respond.`,
            type: 'employment',
            payload: {
                employment_id: employment.id,
                company_id: company.id,
                company_name: company.name,
                action: 'employment_created'
            }
        });
    } catch (error) {
        console.error('Failed to send employment notification:', error);
    }

    res.status(201).json({
        success: true,
        message: 'Employment created successfully',
        data: { employment }
    });
});

// Terminate employment
export const terminateEmployment = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.company_id !== company.id) {
        throw new AppError('Not authorized to terminate employment for this company', 403);
    }

    const { employmentId } = req.params;

    const employment = await EmployeeCompany.findOne({
        where: { id: employmentId, company_id: company.id },
        include: [{
            model: User,
        }]
    });

    if (!employment) {
        throw new AppError('Employment record not found', 404);
    }

    if (employment.status !== 'active') {
        throw new AppError('Only active employment can be terminated', 400);
    }

    // Update status to terminated
    await employment.update({ status: 'terminated', end_date: new Date() });

    // Send notification to employee
    try {
        await createAndSendNotification({
            user_id: employment.employee_id,
            title: 'Employment Terminated',
            message: `Your employment with ${company.name} has been terminated.`,
            type: 'employment',
            payload: {
                employment_id: employment.id,
                company_id: company.id,
                company_name: company.name,
                action: 'employment_terminated'
            }
        });
    } catch (error) {
        console.error('Failed to send termination notification:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Employment terminated successfully',
        data: { employment }
    });
});

// Cancel employment (only pending)
export const cancelEmployment = asyncHandler(async (req, res) => {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
        throw new AppError('Company not found', 404);
    }

    if (req.user.company_id !== company.id) {
        throw new AppError('Not authorized to cancel employment for this company', 403);
    }

    const { employmentId } = req.params;

    const employment = await EmployeeCompany.findOne({
        where: { id: employmentId, company_id: company.id },
        include: [{
            model: User,
            attributes: { exclude: ['password'] }
        }]
    });

    if (!employment) {
        throw new AppError('Employment record not found', 404);
    }

    if (employment.status !== 'pending') {
        throw new AppError(`Cannot cancel employment. Only pending employments can be cancelled. Current status: ${employment.status}`, 400);
    }

    // Update status to cancelled
    await employment.update({ status: 'cancelled' });

    // Send notification to employee
    try {
        await createAndSendNotification({
            user_id: employment.employee_id,
            title: 'Employment Offer Cancelled',
            message: `The employment offer from ${company.name} has been cancelled.`,
            type: 'employment',
            payload: {
                employment_id: employment.id,
                company_id: company.id,
                company_name: company.name,
                action: 'employment_cancelled'
            }
        });
    } catch (error) {
        console.error('Failed to send cancellation notification:', error);
    }

    res.status(200).json({
        success: true,
        message: 'Employment cancelled successfully',
        data: { employment }
    });
});

export const checkClientEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Check if email belongs to a registered client
    const client = await User.findOne({
        where: {
            email,
            role: 'client'
        },
        attributes: ['id', 'email', 'name', 'is_verified']
    });

    res.status(200).json({
        success: true,
        message: client
            ? 'Email belongs to a registered client'
            : 'Email does not belong to a registered client',
        data: {
            isRegistered: !!client,
            client: client || null
        }
    });
});
