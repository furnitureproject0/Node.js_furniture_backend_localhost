import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// console.log('JWT_SECRET in passport.js:', process.env.JWT_SECRET);

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import additionRoutes from './routes/additionRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import siteAdminRoutes from './routes/siteAdminRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import { createServer } from 'http';
import setupSocketIO from './config/socket.js';
import errorMiddleware from './middleware/error-mw.js';
import { testMail } from './controllers/testMailController.js';
import './config/passport.js';

//
import admin from './routes/admin/index.js';
import vehicle from './routes/vehicle-routes.js';
import addition from './routes/addition-routes.js';
import service from './routes/service-routes.js';
import order from './routes/order-routes.js';
import offer from './routes/offer-routes.js';
import user from './routes/user-routes.js';
import userCompany from './routes/user-company-routes.js';
import notification from './routes/notification-routes.js';
import appointment from './routes/appointment-routes.js';
//


const app = express();


const allowedOrigins = process.env.CLIENT_URLS.split(',');

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.set('trust proxy', 1);

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploads statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/additions', additionRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/site-admin', siteAdminRoutes);
app.use('/api/seed', seedRoutes);

// new routes
app.use('/api/admin', admin);
app.use('/api/vehicles', vehicle);
app.use('/api/additions-v2', addition);
app.use('/api/services-v2', service);
app.use('/api/orders-v2', order);
app.use('/api/offers-v2', offer);
app.use('/api/users-v2', user);
app.use('/api/admin-companies-v2', userCompany);
app.use('/api/notifications-v2', notification);
app.use('/api/appointments', appointment);
// Test mail endpoint
app.get('/api/testmail', testMail);

// Global error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: false, force: false });
        } else {
            await sequelize.sync();
        }
        console.log('Database synchronized successfully.');

        const server = createServer(app);
        const io = setupSocketIO(server);
        global.io = io;

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1);
    }
};

start();
