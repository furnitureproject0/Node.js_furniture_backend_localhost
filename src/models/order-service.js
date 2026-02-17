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
    to_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'locations',
            key: 'id'
        }
    },
    from_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'locations',
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
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    details: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'order_services',
    timestamps: true
});

export default OrderService;