import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './user.js';
import { Op } from 'sequelize';

const OTP = sequelize.define('OTP', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    otp: {
        type: DataTypes.STRING(6),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('email_verification', 'password_reset'),
        allowNull: false,
        defaultValue: 'email_verification'
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'otps',
    timestamps: true,
    underscored: true
    // indexes: [
    //     {
    //         unique: true,
    //         fields: ['user_id', 'type'],
    //         where: {
    //             used: false,
    //             expires_at: {
    //                 [DataTypes.Op.gt]: sequelize.fn('NOW')
    //             }
    //         }
    //     }
    // ]
});

// Automatically delete expired OTPs older than 24 hours
OTP.deleteExpired = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await OTP.destroy({
        where: {
            expires_at: {
                [Op.lt]: yesterday
            }
        }
    });
};

export default OTP;