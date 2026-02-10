import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Phone = sequelize.define('Phone', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    owner_type: {
        type: DataTypes.ENUM('User', 'Company'),
        allowNull: false,
    },
}, {
    tableName: 'phones',
    timestamps: false,
});

export default Phone;
