import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Report from './report.js';
import User from './user.js';

const ReportEmployee = sequelize.define('ReportEmployeeHours', {
    report_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Report,
            key: 'id'
        }
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    }
}, {
    tableName: 'report_employee',
    timestamps: true,
    underscored: true
});

export default ReportEmployee;
