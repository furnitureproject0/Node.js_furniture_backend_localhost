import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import Company from './company.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    birthdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM(
            'super_admin',
            'site_admin',
            'company_admin',
            'company_secretary',
            'driver',
            'worker',
            'client'
        ),
        allowNull: false,
        defaultValue: 'client'
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Company,
            key: 'id',
        }
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'companies',
            key: 'id'
        }
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

export default User;
