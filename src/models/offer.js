import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import OrderService from './order-service.js';
import Company from './company.js';

const Offer = sequelize.define('Offer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: OrderService,
            key: 'id'
        }
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Company,
            key: 'id'
        }
    },
    hourly_rate: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'CHF'
    },
    min_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    max_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'offers',
    timestamps: true
});

export default Offer;
