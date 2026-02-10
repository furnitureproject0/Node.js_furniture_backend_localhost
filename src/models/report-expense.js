import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Report from './report.js';

//expense
const ReportExpense = sequelize.define('ReportExpense', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    report_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Report,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.TEXT, // cach or twint -> for report expenses must be cach
        allowNull: false
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
    }
}, {
    tableName: 'report_expenses',
    timestamps: true,
    underscored: true
});

export default ReportExpense;
