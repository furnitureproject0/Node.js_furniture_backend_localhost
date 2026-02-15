import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { count } from 'node:console';

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    lon: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    fax: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'suspended'),
        defaultValue: 'active',
        allowNull: false
    },
}, {
    tableName: 'companies',
    timestamps: true,
});

export default Company;
