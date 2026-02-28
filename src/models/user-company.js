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
        primaryKey: true
    },
    company_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'companies',
            key: 'id'
        },
        primaryKey: true
    },
    type: { 
        type: DataTypes.ENUM('internal', 'external'),
        allowNull: false,
        defaultValue: 'external'
    }
}, {
    tableName: 'user_companies',
    timestamps: true,
    underscored: true

});

export default UserCompany;