import express from 'express';
import { cancelOrder, createOrder, updateOrder } from '../controllers/client.order.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import {
    getOrders,
    getOrderById,
} from '../controllers/orderController.js'
import validate from '../middleware/validatin-mw.js';
import { createOrderSchema, updateOrderSchema } from '../validation/order-schema.js';
import { createReportSchema, updateReportSchema } from '../validation/report-schema.js';
import { getAvailableCompanies, assignCompanyToOrderService } from '../controllers/siteAdminOrderController.js'
import {
    acceptOrderService,
    cancelOrderService,
    rejectOrderService
} from '../controllers/company-admin.order.controller.js';
import { createOffer, getOffersForOrderService } from '../controllers/offerController.js';
import {
    createReport,
    getReportForOrderService,
    updateReport,
} from '../controllers/reportController.js';
import { parseMultipartFields } from '../middleware/parse-multipart.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('client', 'site_admin', 'company_admin', 'company_secretary'), getOrders);
router.get('/:id', authorize('client', 'site_admin', 'company_admin', 'company_secretary'), getOrderById)
router.post(
    '/',
    authorize('client'),
    upload.array('images', 10),
    parseMultipartFields,
    validate(createOrderSchema),
    createOrder
);
router.patch(
    '/:id',
    authorize('client'),
    upload.array('images', 10),
    parseMultipartFields,
    validate(updateOrderSchema),
    updateOrder
);

// Cancel order
router.patch(
    '/:id/cancel',
    authorize('client', 'site_admin'),
    cancelOrder
)

// Get available companies for an orderService
router.get('/:orderId/orderServices/:orderServiceId/companies', authorize('site_admin'), getAvailableCompanies);

// Assign company to an orderService
router.post('/:orderId/orderServices/:orderServiceId/assign', authorize('site_admin'), assignCompanyToOrderService);

// Accept assigned orderService
router.patch(
    '/:orderId/orderServices/:orderServiceId/accept',
    authorize('company_admin', 'company_secretary'),
    acceptOrderService
);

// Reject assigned orderService
router.patch(
    '/:orderId/orderServices/:orderServiceId/reject',
    authorize('company_admin', 'company_secretary'),
    rejectOrderService
);

// Cancel orderService
router.patch(
    '/:orderId/orderServices/:orderServiceId/cancel',
    authorize('company_admin', 'company_secretary'),
    cancelOrderService
);

// Create offer for an orderService
router.post(
    '/:orderId/orderServices/:orderServiceId/offers',
    authorize('company_admin'),
    createOffer
);

// Get offers for an orderService (client sees all, company_admin sees only their own)
router.get(
    '/:orderId/orderServices/:orderServiceId/offers',
    authorize('client', 'company_admin'),
    getOffersForOrderService
);

// Create a report for an order service (only team leader, one report per order service)
router.post(
    '/:orderId/orderServices/:orderServiceId/report',
    authorize('worker', 'driver'),
    validate(createReportSchema),
    createReport
);

// update a report
router.patch(
    '/:orderId/orderServices/:orderServiceId/report',
    authorize('worker', 'driver'),
    validate(updateReportSchema),
    updateReport
)

// Get the report for an order service (single report)
router.get(
    '/:orderId/orderServices/:orderServiceId/report',
    authorize('company_admin', 'company_secretary', 'worker', 'driver'),
    getReportForOrderService
);



export default router;