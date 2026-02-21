import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Vehicle = sequelize.define('Vehicle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null until assigned to a company
        references: {
            model: 'companies',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('car', 'truck', 'van', 'motorcycle', 'trailer', 'lift', 'other'),
        allowNull: false,
        defaultValue: 'truck'
    },
    license_plate: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    manufacturer: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    passenger_seats: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 2,
        comment: 'Number of passenger seats excluding the driver'
    },
    volume_capacity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    weight_capacity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    height: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Height in meters (critical for garages)'
    },
    width: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Width in meters'
    },
    length: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Length in meters'
    },
    status: {
        type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'vehicles',
    timestamps: true,
    underscored: true,
});

export default Vehicle;