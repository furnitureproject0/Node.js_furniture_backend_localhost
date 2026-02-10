import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './company.js';

const CompanySocialMedia = sequelize.define('CompanySocialMedia', {
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
    platform: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    }
}, {
    tableName: 'company_social_media',
    timestamps: true
});

export default CompanySocialMedia;