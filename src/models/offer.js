// models/offer.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Order from './order.js';

const Offer = sequelize.define('Offer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Ensures 1-to-1 relationship (One Order has One Offer state)
        references: {
            model: Order,
            key: 'id'
        }
    },
    client_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'True if the client accepted the offer pricing'
    },
    company_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'True if the main company assigned to the order accepted'
    },
    all_companies_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'True when ALL involved service companies have accepted'
    },
    is_confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'True when client_accepted, company_accepted, and all_companies_accepted are ALL true'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'offers',
    timestamps: true,
    underscored: true
});

export default Offer;