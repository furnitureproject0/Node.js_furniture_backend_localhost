import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Addition = sequelize.define('Addition', {
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
        allowNull: true,
        defaultValue: {},
        comment: 'What extra info is needed if the user selects this addition?'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'additions',
    timestamps: true
});

export default Addition;