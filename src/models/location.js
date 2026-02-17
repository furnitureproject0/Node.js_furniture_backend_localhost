import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Location = sequelize.define('Location', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true // make it reverse
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true // make it reverse
    },
    zip_code: {
        type: DataTypes.STRING,
        allowNull: true // make it reverse
    },
    lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    lon: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    area: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
            min: 0
        }
    },
    floor: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    number_of_floors: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // has_elevator: {
    //     type: DataTypes.BOOLEAN,
    //     allowNull: true,
    //     defaultValue: false
    // },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'locations',
    timestamps: true,
    underscored: true
});

export default Location;
