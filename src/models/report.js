import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import OrderService from './order-service.js';
import User from './user.js';

const Report = sequelize.define('Report', {
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    numofHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    expected_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'twint'),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'reports',
    timestamps: true,
    underscored: true
});

export default Report;
