import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Addition from './addition.js';
import Service from './service.js';

const ServiceAddition = sequelize.define('ServiceAddition', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Service,
            key: 'id'
        }
    },
    addition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Addition,
            key: 'id'
        }
    }
}, {
    tableName: 'service_addition',
    timestamps: true
});

export default ServiceAddition;