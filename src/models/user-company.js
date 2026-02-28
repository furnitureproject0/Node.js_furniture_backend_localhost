'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserCompany = sequelize.define('UserCompany', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        },
        // primaryKey: true
    },
    company_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'companies',
            key: 'id'
        },
        // primaryKey: true
    },
    type: { 
        type: DataTypes.ENUM('internal', 'external'),
        allowNull: false,
        defaultValue: 'external'
    }
}, {
    tableName: 'user_companies',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'company_id', 'type'],
            name: 'unique_user_company_type'
        }
    ]
});

export default UserCompany;