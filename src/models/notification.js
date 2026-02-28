import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';


const Notification = sequelize.define('Notification', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    actor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },

    title: {
        type: DataTypes.STRING,
        allowNull: false
    },

    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    type: {
        type: DataTypes.ENUM(
            'welcome', //
            'email_verified', //
            'order', //
            'offer', //
            'chat', //
            'employment', //
            'system', //
            // add more types as needed
            'internal_company',
            'external_company',
            'mother_company',
            'account',
            'company',
            'security'
        ),
        allowNull: false,
        defaultValue: 'system'
    },

    entity_type: {
        type: DataTypes.STRING,
        allowNull: true
    },

    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    payload: {
        type: DataTypes.JSON,
        allowNull: true
    }

}, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
});

export default Notification;