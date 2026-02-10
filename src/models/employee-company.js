import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './user.js';
import Company from './company.js';

const EmployeeCompany = sequelize.define('EmployeeCompany', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
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
            model: Company,
            key: 'id'
        }
    },
    hourly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'CHF'
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'rejected', 'terminated', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    start_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'employees_companies',
    timestamps: true
});

export default EmployeeCompany;