import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './user.js';
import Location from './location.js';

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies',
            key: 'id'
        }
    },
    execution_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Preferred date for this specific service'
    },
    execution_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    primary_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'locations',
            key: 'id'
        }
    },
    secondary_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'locations',
            key: 'id'
        }
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM(
            'pending',         // client placed the order
            'in_progress',     // at least one service is ongoing
            'partially_done',  // some services done, others pending
            'completed',       // all services done
            'cancelled'        // order cancelled (before or during execution)
        ),
        allowNull: false,
        defaultValue: 'pending'
    },
    fixed_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    min_total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    max_total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('order', 'offer', 'appointment'),
        defaultValue: 'order',
        allowNull: false
    }
}, {
    tableName: 'orders',
    timestamps: true,
    underscored: true
});

export default Order;