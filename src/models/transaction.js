import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Report from './report.js';
import User from './user.js';
import Company from './company.js';

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Optional reference to report (null for non-report transactions)
    report_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Report,
            key: 'id'
        }
    },
    // Optional reference to company (for administrative expenses)
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Company,
            key: 'id'
        }
    },
    // Optional reference to user (for employee payments or user-specific transactions)
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    // Transaction type: report_expense, order_expense, administrative_expense
    transaction_type: {
        type: DataTypes.ENUM(
            'order_expense',
            'administrative_expense',
            'order_payment'
        ),
        allowNull: false,
    },
    // Payment method: cash, twint, bank_transfer, credit_card, etc.
    payment_method: {
        type: DataTypes.ENUM('cash', 'twint'),
        allowNull: false,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    // Transaction status: pending, completed, cancelled, refunded
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'completed'
    },
    // Reference number (invoice number, receipt number, etc.)
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
}, {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['report_id']
        },
        {
            fields: ['company_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['transaction_type']
        },
        {
            fields: ['transaction_date']
        },
        {
            fields: ['status']
        }
    ]
});

export default Transaction;
