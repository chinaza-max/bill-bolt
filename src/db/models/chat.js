import { Model, DataTypes } from 'sequelize';

class Chat extends Model {}

export function init(connection) {
  Chat.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId1: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId2: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      roomId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      messageType: {
        type: DataTypes.ENUM('text', 'file'),
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      repliedMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Chat',
          key: 'id',
        },
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // New fields for message status
      messageStatus: {
        type: DataTypes.ENUM('sent', 'delivered', 'read'),
        allowNull: false,
        defaultValue: 'sent',
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'Chat',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default Chat;
