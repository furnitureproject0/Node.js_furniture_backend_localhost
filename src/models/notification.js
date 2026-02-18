import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './user.js';

const Notification = sequelize.define('Notification', {
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
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM(
            'welcome',
            'email_verified',
            'order',
            'offer',
            'chat',
            'employment',
            'system',
            // add more types as needed
            'admin_alerts',
            'company_updates',
            'security_alerts',
            'promotions',
            'reminders',
            'feedback_requests',
            'order_status',
            'internal_company',
            'external_company',
            'mother_company',
            'account_deleted',
            'update'
        ),
        allowNull: false,
        defaultValue: 'system'
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }, 
    show: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['createdAt']
        }
    ]
});

// Automatically delete notifications older than 30 days
// Notification.deleteOld = async () => {
//     const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//     await Notification.destroy({
//         where: {
//             created_at: {
//                 [DataTypes.Op.lt]: thirtyDaysAgo
//             }
//         }
//     });
// };

export default Notification;