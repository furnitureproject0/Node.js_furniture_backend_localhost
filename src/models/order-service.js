import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Order from './order.js';
import Service from './service.js';
import Company from './company.js';

const OrderService = sequelize.define('OrderService', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Order,
            key: 'id'
        }
    },
    service_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Service,
            key: 'id'
        }
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null until assigned
        references: {
            model: Company,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM(
            'pending',             // waiting for assignment
            'assigned',            // assigned to a company
            'accepted_by_company', // company accepted
            'rejected_by_company', // company refused
            'offer_sent',          // company made an offer
            'offer_accepted',      // client accepted
            'offer_rejected',      // client rejected
            'completed',           // finished
            'cancelled'            // cancelled before completion
        ),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'order_services',
    timestamps: true
});

export default OrderService;