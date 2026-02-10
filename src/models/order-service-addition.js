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
    note: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'order_service_additions',
    timestamps: true
});

export default OrderServiceAddition;
