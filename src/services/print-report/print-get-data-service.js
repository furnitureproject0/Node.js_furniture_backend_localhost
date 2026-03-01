import { Order, User, Company, Location, OrderService, Service, OrderServiceAddition, Addition, Vehicle, OrderVehicle, Phone } from '../../models/index.js'; // تأكد من مسار الموديلز
import AppError from '../../utils/AppError.js';
import { formatOrderData } from './print-format-data-service.js';

export const getOrderPDFDataService = async (orderId) => {
    const order = await Order.findByPk(orderId, {
        include: [
            { model: User, as: 'client' }, 
            { model: Company, as: 'company' },
            { model: Location, as: 'primary_location' },
            { model: Location, as: 'secondary_location' },
            {
                model: OrderService,
                as: 'orderServices', 
                include: [
                    { model: Service, as: 'service' },
                    {
                        model: OrderServiceAddition,
                        as: 'additions',
                        include: [{ model: Addition, as: 'Addition' }]
                    }
                ]
            },
            {
                model: Vehicle, // هنستخدم Vehicle مباشرة
                as: 'assigned_vehicles', // نفس الاسم اللي إنت مستخدمه في العلاقات
                through: { attributes: [] } // عشان نخفي بيانات الجدول الوسيط ملهاش لازمة
            }
        ]
    });

    if (!order) throw new AppError('Order not found', 404);

    const dbOrder = order.get({ plain: true });

    dbOrder.clientPhones = await Phone.findAll({ where: { owner_id: dbOrder.client_id, owner_type: 'User' }, raw: true });
    dbOrder.companyPhones = await Phone.findAll({ where: { owner_id: dbOrder.company_id, owner_type: 'Company' }, raw: true });

    dbOrder.companyAdmins = await User.findAll({
        where: { 
            company_id: dbOrder.company_id, 
            role: ['company_admin', 'company_secretary', 'site_admin'] 
        },
        raw: true
    });

    return formatOrderData(dbOrder);
};