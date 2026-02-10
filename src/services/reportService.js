import { Offer, OfferEmployee, Report, OrderService } from '../models/index.js';
import AppError from '../utils/AppError.js';

export const checkReportAccessPermission = async (userId, orderServiceId, offer) => {
    const orderService = await OrderService.findByPk(orderServiceId);
    if (!orderService) {
        throw new AppError('Order service not found', 404);
    }

    const assignment = await OfferEmployee.findOne({
        where: {
            offer_id: offer.id,
            employee_id: userId,
            status: 'accepted'
        }
    });

    if (!assignment) {
        throw new AppError('You are not assigned to this order service', 403);
    }

    if (!assignment.is_leader) {
        throw new AppError('Only the team leader can create reports for this order service', 403);
    }

    return {
        offer,
        assignment,
        orderService
    };
};

export const validateEmployeesInAcceptedOffer = async (offer, employeeIds) => {
    if (!employeeIds || employeeIds.length === 0) {
        return;
    }

    const acceptedEmployees = await OfferEmployee.findAll({
        where: {
            offer_id: offer.id,
            status: 'accepted'
        }
    });

    const acceptedEmployeeIds = acceptedEmployees.map(emp => emp.employee_id);

    const invalidEmployees = employeeIds.filter(empId => !acceptedEmployeeIds.includes(empId));

    if (invalidEmployees.length > 0) {
        throw new AppError(
            `The following employees are not part of the accepted offer or don't have accepted status: ${invalidEmployees.join(', ')}`,
            400
        );
    }
};

export const validateReportTimingAfterOffer = async (orderServiceId) => {
    const acceptedOffer = await Offer.findOne({
        where: {
            order_service_id: orderServiceId,
            status: 'accepted'
        }
    });

    if (!acceptedOffer) {
        throw new AppError('No accepted offer found for this order service', 404);
    }

    const offerDateTime = new Date(`${acceptedOffer.date}T${acceptedOffer.time}`);
    const currentDateTime = new Date();

    if (currentDateTime < offerDateTime) {
        throw new AppError(
            `Cannot create report before the scheduled offer time. Offer is scheduled for ${offerDateTime.toLocaleString()}`,
            400
        );
    }
};


export const validateSingleReportPerOrderService = async (orderServiceId) => {
    const existingReport = await Report.findOne({
        where: {
            order_service_id: orderServiceId
        }
    });

    if (existingReport) {
        throw new AppError('A report already exists for this order service. Only one report is allowed per order service.', 400);
    }
};


export const getAcceptedOfferForOrderService = async (orderServiceId) => {
    const acceptedOffer = await Offer.findOne({
        where: {
            order_service_id: orderServiceId,
            status: 'accepted'
        },
        include: [{
            model: OfferEmployee,
            as: 'assignments',
            where: { status: 'accepted' },
            required: false
        }]
    });

    if (!acceptedOffer) {
        throw new AppError('No accepted offer found for this order service', 404);
    }

    return acceptedOffer;
};
