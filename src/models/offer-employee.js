// models/offerEmployee.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Offer from './offer.js';
import User from './user.js';

const OfferEmployee = sequelize.define(
    'OfferEmployee',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        offer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Offer,
                key: 'id',
            },
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_leader: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    },
    {
        tableName: 'offer_employees',
        timestamps: true,
        underscored: true
    }
);

export default OfferEmployee;
