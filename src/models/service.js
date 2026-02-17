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
        type: DataTypes.ENUM('per_hour', 'per_square_meter', 'per_cubic_meter', 'per_quantity', 'per_room', 'flat_rate', 'custom'),
        allowNull: false
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