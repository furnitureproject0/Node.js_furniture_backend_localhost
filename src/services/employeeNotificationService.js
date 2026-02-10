import { createAndSendNotification } from '../utils/notifications.js';
import { User } from '../models/index.js';

/**
 * Notify company admin when employee accepts employment
 */
export const notifyCompanyAdminEmploymentAccepted = async ({ companyId, employmentId, employeeName, companyName }) => {
    try {
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            }
        });

        if (!companyAdmin) {
            console.warn(`No company admin found for company ${companyId}`);
            return null;
        }

        const payload = {
            employment_id: employmentId,
            company_id: companyId,
            action: 'employment_accepted',
            link: `/employees`
        };

        const notificationData = {
            user_id: companyAdmin.id,
            title: 'Employment Accepted',
            message: `${employeeName} has accepted the employment offer from ${companyName}.`,
            type: 'employment',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify company admin of employment acceptance:', error);
        return null;
    }
};

/**
 * Notify company admin when employee rejects employment
 */
export const notifyCompanyAdminEmploymentRejected = async ({ companyId, employmentId, employeeName, companyName }) => {
    try {
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            }
        });

        if (!companyAdmin) {
            console.warn(`No company admin found for company ${companyId}`);
            return null;
        }

        const payload = {
            employment_id: employmentId,
            company_id: companyId,
            action: 'employment_rejected',
            link: `/employees`
        };

        const notificationData = {
            user_id: companyAdmin.id,
            title: 'Employment Rejected',
            message: `${employeeName} has rejected the employment offer from ${companyName}.`,
            type: 'employment',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify company admin of employment rejection:', error);
        return null;
    }
};

/**
 * Notify employee when assigned to an offer
 */
export const notifyEmployeeAssignedToOffer = async ({ employeeId, offerId, assignmentId, serviceName, companyName }) => {
    try {
        const payload = {
            offer_id: offerId,
            assignment_id: assignmentId,
            action: 'assigned_to_offer',
        };

        const notificationData = {
            user_id: employeeId,
            title: 'New Assignment',
            message: `You have been assigned to an offer for service "${serviceName}" by ${companyName}.`,
            type: 'employment',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify employee of assignment:', error);
        return null;
    }
};

/**
 * Notify employee when assignment is revoked
 */
export const notifyEmployeeAssignmentRevoked = async ({ employeeId, offerId, assignmentId, serviceName, companyName }) => {
    try {

        const payload = {
            offer_id: offerId,
            assignment_id: assignmentId,
            action: 'assignment_revoked',
            link: `/offers/${offerId}`
        };

        const notificationData = {
            user_id: employeeId,
            title: 'Assignment Revoked',
            message: `Your assignment to the offer for service "${serviceName}" has been revoked by ${companyName}.`,
            type: 'employment',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify employee of assignment revocation:', error);
        return null;
    }
};

/**
 * Notify employee when made leader of an offer
 */
export const notifyEmployeeMadeLeader = async ({ employeeId, offerId, assignmentId, serviceName }) => {
    try {
        const payload = {
            offer_id: offerId,
            assignment_id: assignmentId,
            action: 'made_leader'
        };

        const notificationData = {
            user_id: employeeId,
            title: 'Made Team Leader',
            message: `You have been made the team leader for the offer for service "${serviceName}".`,
            type: 'employment',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify employee of leader status:', error);
        return null;
    }
};

/**
 * Notify previous leader when leadership is transferred
 */
export const notifyEmployeeLeadershipRemoved = async ({ employeeId, offerId, assignmentId, serviceName }) => {
    try {
        const payload = {
            offer_id: offerId,
            assignment_id: assignmentId,
            action: 'leadership_removed'
        };

        const notificationData = {
            user_id: employeeId,
            title: 'Leadership Transferred',
            message: `The team leader role for the offer for service "${serviceName}" has been transferred to another employee.`,
            type: 'employment',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify employee of leadership removal:', error);
        return null;
    }
};
