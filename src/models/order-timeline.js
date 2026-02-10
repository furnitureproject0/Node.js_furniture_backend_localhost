import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Order from './order.js';

const OrderTimeline = sequelize.define('OrderTimeline', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'assigned', 'offer_sent', 'offer_accepted',
            'offer_rejected', 'offer_cancelled', 'service_completed',
            'cancelled'),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'order_timelines',
    timestamps: true,
    updatedAt: false
});

export default OrderTimeline;