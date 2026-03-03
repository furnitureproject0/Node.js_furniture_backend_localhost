import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './user.js';
import Company from './company.js';
import Order from './order.js';


const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Company,
            key: 'id'
        }
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Order,
            key: 'id'
        } 
    },
    expected_date: {
        type: DataTypes.DATEONLY, 
        allowNull: false,
    },
    expected_time: {
        type: DataTypes.TIME, 
        allowNull: false,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'appointments',
    timestamps: true,
    underscored: true
});

export default Appointment;