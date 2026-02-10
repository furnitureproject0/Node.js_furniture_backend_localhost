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
    location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Location,
            key: 'id'
        }
    },
    destination_location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Location,
            key: 'id'
        }
    },
    preferred_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    preferred_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    number_of_rooms: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    rooms: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
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
    }
}, {
    tableName: 'orders',
    timestamps: true
});

export default Order;