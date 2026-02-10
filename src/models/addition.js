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
    }
}, {
    tableName: 'additions',
    timestamps: true
});

export default Addition;