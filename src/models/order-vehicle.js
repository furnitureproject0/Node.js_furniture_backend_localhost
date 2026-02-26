import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Order from './order.js';
import Vehicle from './vehicle.js';
const OrderVehicle = sequelize.define('OrderVehicle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Order, key: 'id' },
        onDelete: 'CASCADE'
    },
    vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Vehicle, key: 'id' }
    },
    // ممكن تخزن السواق كمان هنا لو حابب
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: 'order_vehicles',
    timestamps: true,
    underscored: true
});

export default OrderVehicle;