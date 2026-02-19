const NotificationRecipient = sequelize.define('NotificationRecipient', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    notification_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'notifications',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },

    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    show: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }

}, {
    tableName: 'notification_recipients',
    timestamps: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['notification_id'] }
    ]
});
