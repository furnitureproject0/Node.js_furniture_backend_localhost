import Company from './company.js';
import EmployeeCompany from './employee-company.js';
import CompanySocialMedia from './company-social-media.js';
import CompanyService from './company-service.js';
import Phone from './phone.js';
import User from './user.js';
import Addition from './addition.js';
import Order from './order.js';
import OrderTimeline from './order-timeline.js';
import OrderService from './order-service.js';
import Service from './service.js';
import Offer from './offer.js';
import OfferEmployee from './offer-employee.js';
import Report from './report.js';
import ReportEmployee from './report-employee.js';
import Transaction from './transaction.js';
import Location from './location.js';
import ServiceAddition from './service-addition.js';
import OrderServiceAddition from './order-service-addition.js';

// Company Social Media
Company.hasMany(CompanySocialMedia, {
    foreignKey: 'company_id',
    as: 'socialMedia'
});

CompanySocialMedia.belongsTo(Company, {
    foreignKey: 'company_id'
});

// Many-to-Many relationship between Company and Employees (workers & drivers, company_secretary)
Company.belongsToMany(User, {
    through: {
        model: EmployeeCompany,
        unique: false
    },
    foreignKey: 'company_id',
    otherKey: 'employee_id',
    as: 'employments'
});

User.belongsToMany(Company, {
    through: {
        model: EmployeeCompany,
        unique: false
    },
    // foreignKey: '{employee_id',
    foreignKey: 'employee_id',
    otherKey: 'company_id',
    as: 'employedAt'
});

EmployeeCompany.belongsTo(User, {
    foreignKey: 'employee_id'
});

User.hasMany(EmployeeCompany, {
    foreignKey: 'employee_id',
    as: 'employments'
});

EmployeeCompany.belongsTo(Company, {
    foreignKey: 'company_id'
});

Company.hasMany(EmployeeCompany, {
    foreignKey: 'company_id'
});

// Order associations
// order <-> client
Order.belongsTo(User, {
    foreignKey: 'client_id',
    as: 'client'
});

User.hasMany(Order, {
    foreignKey: 'client_id',
    as: 'orders'
});


// order <-> timeline
Order.hasMany(OrderTimeline, {
    foreignKey: 'order_id',
    as: 'timeline'
});

OrderTimeline.belongsTo(Order, {
    foreignKey: 'order_id'
});

// Order ↔ OrderService
Order.hasMany(OrderService, {
    foreignKey: 'order_id',
    as: 'orderServices'
});

OrderService.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
});

// Service ↔ OrderService
Service.hasMany(OrderService, {
    foreignKey: 'service_id',
    as: 'orderServices'
});

OrderService.belongsTo(Service, {
    foreignKey: 'service_id',
    as: 'service'
});

// orderService - addition
// Associations
OrderService.hasMany(OrderServiceAddition, { foreignKey: 'order_service_id', as: 'additions' });
OrderServiceAddition.belongsTo(OrderService, { foreignKey: 'order_service_id' });

Addition.hasMany(OrderServiceAddition, { foreignKey: 'addition_id' });
OrderServiceAddition.belongsTo(Addition, { foreignKey: 'addition_id' });

// Company ↔ OrderService
Company.hasMany(OrderService, {
    foreignKey: 'company_id',
    as: 'orderServices'
});

OrderService.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
});

// Company-Service many-to-many relationship
Company.belongsToMany(Service, {
    through: CompanyService,
    foreignKey: 'company_id',
    otherKey: 'service_id',
    as: 'services'
});

Service.belongsToMany(Company, {
    through: CompanyService,
    foreignKey: 'service_id',
    otherKey: 'company_id',
    as: 'companies'
});

// phone model associations
// For users
User.hasMany(Phone, {
    foreignKey: 'owner_id',
    constraints: false,
    as: 'phones',
    scope: {
        owner_type: 'User',
    },
});
Phone.belongsTo(User, {
    foreignKey: 'owner_id',
    constraints: false,
});

// For companies
Company.hasMany(Phone, {
    foreignKey: 'owner_id',
    constraints: false,
    as: 'phones',
    scope: {
        owner_type: 'Company',
    },
});

Phone.belongsTo(Company, {
    foreignKey: 'owner_id',
    constraints: false,
});


// offer associations
Offer.belongsTo(OrderService, {
    foreignKey: "order_service_id",
    as: "orderService",
});

// OrderService has many Offers
OrderService.hasMany(Offer, {
    foreignKey: "order_service_id",
    as: "offers", // only one pending at a time 
});

Offer.belongsTo(Company, {
    foreignKey: "company_id",
    as: "company",
});

Company.hasMany(Offer, {
    foreignKey: "company_id",
    as: "offers",
});



// Offer Employee associations
Offer.hasMany(OfferEmployee, {
    foreignKey: 'offer_id',
    as: 'assignments'
});

OfferEmployee.belongsTo(Offer, {
    foreignKey: 'offer_id',
    as: 'offer'
});

User.hasMany(OfferEmployee, {
    foreignKey: 'employee_id',
    as: 'offerAssignments'
});

OfferEmployee.belongsTo(User, {
    foreignKey: 'employee_id',
    as: 'employee'
});


// Report associations
Report.belongsTo(OrderService, {
    foreignKey: 'order_service_id',
    as: 'orderService'
});

OrderService.hasMany(Report, {
    foreignKey: 'order_service_id',
    as: 'reports'
});

Report.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'createdBy'
});

User.hasMany(Report, {
    foreignKey: 'created_by',
    as: 'createdReports'
});

// Report Employee Hours associations
Report.hasMany(ReportEmployee, {
    foreignKey: 'report_id',
    as: 'employeeHours'
});

ReportEmployee.belongsTo(Report, {
    foreignKey: 'report_id',
    as: 'report'
});

ReportEmployee.belongsTo(User, {
    foreignKey: 'employee_id',
    as: 'employee'
});

User.hasMany(ReportEmployee, {
    foreignKey: 'employee_id',
    as: 'reportHours'
});

// Transaction associations
Report.hasMany(Transaction, {
    foreignKey: 'report_id',
    as: 'transactions'
});

Transaction.belongsTo(Report, {
    foreignKey: 'report_id',
    as: 'report'
});

Company.hasMany(Transaction, {
    foreignKey: 'company_id',
    as: 'transactions'
});

Transaction.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
});

User.hasMany(Transaction, {
    foreignKey: 'user_id',
    as: 'transactions'
});

Transaction.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// Order Location associations
Order.belongsTo(Location, {
    foreignKey: 'location_id',
    as: 'location'
});

Order.belongsTo(Location, {
    foreignKey: 'destination_location_id',
    as: 'destinationLocation'
});

Location.hasMany(Order, {
    foreignKey: 'location_id',
    as: 'pickupOrders'
});

Location.hasMany(Order, {
    foreignKey: 'destination_location_id',
    as: 'destinationOrders'
});

// service - addition many-to-many relationship through ServiceAdditions

Service.belongsToMany(Addition, {
    through: ServiceAddition,
    foreignKey: 'serviceId',
    otherKey: 'additionId',
    as: 'additions'
});

Addition.belongsToMany(Service, {
    through: ServiceAddition,
    foreignKey: 'additionId',
    otherKey: 'serviceId',
    as: 'services'
});


export {
    User,
    Company,
    EmployeeCompany,
    Phone,
    CompanySocialMedia,
    CompanyService,
    Addition,
    Order,
    OrderTimeline,
    OrderService,
    Service,
    Offer,
    OfferEmployee,
    Report,
    ReportEmployee,
    Transaction,
    Location,
    ServiceAddition,
    OrderServiceAddition
};