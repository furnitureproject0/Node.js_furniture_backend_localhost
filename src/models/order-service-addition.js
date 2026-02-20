import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import OrderService from './order-service.js';
import Addition from './addition.js';

const OrderServiceAddition = sequelize.define('OrderServiceAddition', {
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
        },
        onDelete: 'CASCADE'
    },
    addition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Addition,
            key: 'id'
        }
    },
    pricing_type: {
        type: DataTypes.ENUM('per_hour', 'per_square_meter', 'per_cubic_meter', 'per_quantity', 'per_room', 'flat_rate', 'max_price', 'custom'),
        allowNull: false
    },
    price_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    min_units: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    max_units: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    minimum_charge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    discount_applied: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    details: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'order_service_additions',
    timestamps: true
});

export default OrderServiceAddition;
