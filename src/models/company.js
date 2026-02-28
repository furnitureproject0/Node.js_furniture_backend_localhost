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
    location_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // make it reverse
        references: {
            model: 'locations',
            key: 'id'
        }
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
    type: {
        type: DataTypes.ENUM('internal', 'external'),
        allowNull: true
    }
}, {
    tableName: 'companies',
    timestamps: true,
    underscored: true
});

export default Company;
