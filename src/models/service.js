import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    pricing_type: {
        type: DataTypes.ENUM('per_hour', 'per_square_meter', 'per_cubic_meter', 'per_quantity', 'per_room', 'flat_rate', 'max_price', 'custom'),
        allowNull: true
    },
    price_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    min_units: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    max_units: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    minimum_charge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    requirements: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        comment: 'Schema defining what dynamic fields the frontend should render'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'services'
});

export default Service;