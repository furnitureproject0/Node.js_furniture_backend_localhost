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

            // Create Company first (needed for company users)
            const company = await Company.bulkCreate([
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
            ],
                { transaction: t });

            //  Create Users
            const users = await User.bulkCreate([
                {
                    name: 'waseem',
                    email: 'admin@gmail.com',
                    password: 'Testing+1',
                    role: 'super_admin',
                    is_verified: true,
                },
                {
                    name: 'ahmed',
                    email: 'siteAdmin@gmail.com',
                    password: 'Testing+1',
                    role: 'site_admin',
                    is_verified: true,
                },
                {
                    name: 'John',
                    email: 'client@gmail.com',
                    password: 'Testing+1',
                    role: 'client',
                    is_verified: true,
                },
                {
                    name: 'Michael',
                    email: 'companyAdmin@gmail.com',
                    password: 'Testing+1',
                    role: 'company_admin',
                    company_id: company.id,
                    is_verified: true,
                },
                {
                    name: 'Sarah',
                    email: 'worker@gmail.com',
                    password: 'Testing+1',
                    role: 'worker',
                    company_id: company.id,
                    is_verified: true,
                }
            ], { transaction: t, individualHooks: true });

            //  Create Services
            const services = await Service.bulkCreate([
                {
                    name: 'Moving',
                    description: 'Full-service moving including packing and unpacking',
                },
                {
                    name: 'Cleaning',
                    description: 'Deep cleaning services for homes and offices',
                },
                {
                    name: 'Painting',
                    description: 'Interior and exterior painting services',
                }
            ], { transaction: t });

            //  Create Additions
            const additions = await Addition.bulkCreate([
                {
                    name: 'custom'
                },
                {
                    name: 'Extra boxes',
                },
                {
                    name: 'Fragile item handling',
                },
                {
                    name: 'Eco cleaning materials',
                }
            ], { transaction: t });

            // Associate Company with Services (Moving and Cleaning)
            await CompanyService.bulkCreate([
                {
                    company_id: company[0].id,
                    service_id: services[0].id // Moving
                },
                {
                    company_id: company[0].id,
                    service_id: services[1].id // Cleaning
                }
            ], { transaction: t });

            await ServiceAddition.bulkCreate([
                {
                    serviceId: services[0].id,
                    additionId: additions[1].id
                },
                {
                    serviceId: services[0].id,
                    additionId: additions[2].id
                }
            ], { transaction: t });

            // Create Locations for the order
            const pickupLocation = await Location.create({
                address: '456 Oak Street, Example City',
                lat: 40.7128,
                lon: -74.0060,
                type: 'apartment',
                floor: 3
            }, { transaction: t });

            const destinationLocation = await Location.create({
                address: '789 Pine Avenue, Example City',
                lat: 40.7580,
                lon: -73.9855,
                type: 'house',
                floor: 1
            }, { transaction: t });

            // Create an Order for the client (John - users[2])
            const order = await Order.create({
                client_id: users[2].id, // John (client)
                location_id: pickupLocation.id,
                destination_location_id: destinationLocation.id,
                preferred_date: '2025-11-15',
                preferred_time: '09:00:00',
                number_of_rooms: 3.5,
                notes: 'Please handle fragile items with care. Have some antique furniture.',
                status: 'pending'
            }, { transaction: t });

            // Create OrderServices for the order (Moving and Cleaning)
            await OrderService.bulkCreate([
                {
                    order_id: order.id,
                    service_id: services[0].id, // Moving
                    status: 'pending'
                },
                {
                    order_id: order.id,
                    service_id: services[1].id, // Cleaning
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

// The seeder exposes the `seed` function. To run it directly from the
// command line create a small runner script or call this function from
// your application. This prevents the seeder from auto-running when
// imported by other modules (e.g. the seed endpoint).