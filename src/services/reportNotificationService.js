import { createAndSendNotification } from '../utils/notifications.js';
import { User } from '../models/index.js';

export const notifyCompanyAdminReportCreated = async ({ orderServiceId, companyId, reportId, createdByName }) => {
    try {
        // Single query to get company admin
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            },
            attributes: ['id']
        });

        if (!companyAdmin) {
            console.warn(`No company admin found for company ${companyId}`);
            return null;
        }

        const payload = {
            report_id: reportId,
            order_service_id: orderServiceId,
            action: 'report_created',
        };

        const notificationData = {
            user_id: companyAdmin.id,
            title: 'New Report Created',
            message: `${createdByName} has created a new report for order service #${orderServiceId}.`,
            type: 'order',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify company admin of report creation:', error);
        return null;
    }
};


export const notifyCompanyAdminReportUpdated = async ({ orderServiceId, companyId, reportId, updatedByName }) => {
    try {
        // Single query to get company admin
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            },
            attributes: ['id']
        });

        if (!companyAdmin) {
            console.warn(`No company admin found for company ${companyId}`);
            return null;
        }

        const payload = {
            report_id: reportId,
            order_service_id: orderServiceId,
            action: 'report_updated',
        };

        const notificationData = {
            user_id: companyAdmin.id,
            title: 'Report Updated',
            message: `${updatedByName} has updated the report for order service #${orderServiceId}.`,
            type: 'order',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify company admin of report update:', error);
        return null;
    }
};
