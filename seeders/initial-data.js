import {
    User,
    Service,
    Company,
    CompanyService,
    Addition,
    ServiceAddition,
    Order,
    OrderService,
    Location
} from '../src/models/index.js';
import sequelize from '../src/config/database.js';

export const seed = async () => {
    try {
        await sequelize.transaction(async (t) => {
            const existingUsers = await User.count({ transaction: t });
            const existingServices = await Service.count({ transaction: t });
            const existingCompanies = await Company.count({ transaction: t });
            const existingAdditions = await Addition.count({ transaction: t });

            if (existingUsers > 0 || existingServices > 0 || existingCompanies > 0 || existingAdditions > 0) {
                console.log('Data already exists, skipping seeding.');
                return;
            }

            // Create Companies
            const companies = await Company.bulkCreate([
                {
                    name: "Umzugskönig AG",
                    description:
                        "Professionelle Umzugsfirma in Zürich für Privat- und Firmenumzüge, Reinigungen, Transporte und Speziallösungen.",
                    address: "Althardstrasse 120, 8105 Regensdorf",
                    email: "info@umzugskoenig.ch",
                    website: "https://umzugskoenig.ch",
                    phone: "+41448403000"
                },
                {
                    name: "Rebo Transport GmbH",
                    description:
                        "Professionelles Umzugs- und Transportunternehmen mit über 10 Jahren Erfahrung in Schwertransporten, Umzügen, Reinigungen und Entsorgungen.",
                    address: "Industriestrasse 54, 8152 Glattbrugg",
                    email: "rebotransport.info@gmail.com",
                    website: "https://www.transport-rebo.ch",
                    phone: "0448103333"
                }
            ], { transaction: t });

            // Create Users
            const users = await User.bulkCreate([
                { name: 'waseem', email: 'admin@gmail.com', password: 'Testing+1', role: 'super_admin', is_verified: true },
                { name: 'ahmed', email: 'siteAdmin@gmail.com', password: 'Testing+1', role: 'site_admin', is_verified: true },
                { name: 'John', email: 'client@gmail.com', password: 'Testing+1', role: 'client', is_verified: true },
                { name: 'Michael', email: 'companyAdmin@gmail.com', password: 'Testing+1', role: 'company_admin', company_id: companies[0].id, is_verified: true },
                { name: 'Sarah', email: 'worker@gmail.com', password: 'Testing+1', role: 'worker', company_id: companies[0].id, is_verified: true }
            ], { transaction: t, individualHooks: true });

            // Create Services
            const services = await Service.bulkCreate([
                { name: 'Moving', description: 'Full-service moving including packing and unpacking' },
                { name: 'Cleaning', description: 'Deep cleaning services for homes and offices' },
                { name: 'Painting', description: 'Interior and exterior painting services' }
            ], { transaction: t });

            // Create Additions
            const additions = await Addition.bulkCreate([
                { name: 'custom' },
                { name: 'Extra boxes' },
                { name: 'Fragile item handling' },
                { name: 'Eco cleaning materials' }
            ], { transaction: t });

            // Associate Company with Services
            await CompanyService.bulkCreate([
                { company_id: companies[0].id, service_id: services[0].id },
                { company_id: companies[0].id, service_id: services[1].id }
            ], { transaction: t });

            // Associate Services with Additions
            await ServiceAddition.bulkCreate([
                { service_id: services[0].id, addition_id: additions[1].id },
                { service_id: services[0].id, addition_id: additions[2].id }
            ], { transaction: t });

            // Create Locations
            const pickupLocation = await Location.create({
                address: '456 Oak Street, Example City',
                lat: 40.7128,
                lon: -74.0060,
                type: 'apartment',
                floor: 3,
                city: 'Example City',
                country: 'Example Country',
                zip_code: '12345'
            }, { transaction: t });

            const destinationLocation = await Location.create({
                address: '789 Pine Avenue, Example City',
                lat: 40.7580,
                lon: -73.9855,
                type: 'house',
                floor: 1,
                city: 'Example City',
                country: 'Example Country',
                zip_code: '67890'
            }, { transaction: t });

            // Create Order
            const order = await Order.create({
                client_id: users[2].id,
                company_id: companies[0].id,
                primary_location_id: pickupLocation.id,
                secondary_location_id: destinationLocation.id,
                execution_date: '2025-11-15',
                execution_time: '09:00:00',
                status: 'pending',
                notes: 'Please handle fragile items with care. Have some antique furniture.'
            }, { transaction: t });

            // Create OrderServices
            await OrderService.bulkCreate([
                {
                    order_id: order.id,
                    service_id: services[0].id, // Moving
                    primary_location_id: pickupLocation.id,
                    secondary_location_id: destinationLocation.id,
                    preferred_date: '2025-11-15',
                    preferred_time: '09:00:00',
                    pricing_type: 'custom',
                    price_per_unit: 0,
                    minimum_charge: 0,
                    status: 'pending'
                },
                {
                    order_id: order.id,
                    service_id: services[1].id, // Cleaning
                    primary_location_id: pickupLocation.id,
                    secondary_location_id: destinationLocation.id,
                    preferred_date: '2025-11-15',
                    preferred_time: '09:00:00',
                    pricing_type: 'custom',
                    price_per_unit: 0,
                    minimum_charge: 0,
                    status: 'pending'
                }
            ], { transaction: t });

            console.log('Seed completed successfully.');
        });
    } catch (error) {
        console.error('❌ Seeding error:', error);
        throw error;
    }
};