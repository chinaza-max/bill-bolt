import { Model, DataTypes } from "sequelize";


class Chat extends Model {}

export function init(connection) {
  Chat.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.INTEGER ,
        allowNull: true,
      },
      merchantId: {
        type: DataTypes.INTEGER ,
        allowNull: true
      },
      adminId: {
        type: DataTypes.INTEGER ,
        allowNull: true
      },
      messageType: { 
        type: DataTypes.ENUM(
          'text',
          'file'
        ),
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
      role: {
        type: DataTypes.ENUM(
          'list',
          'rent'
        ),
        allowNull: false,
      },  
      repliedMessageId: {
        type: DataTypes.INTEGER ,
        allowNull: true,
        references: {
          model: 'Chat',
          key: 'id',
        },
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false ,
      }
    }, {
      tableName: 'Chat',
      sequelize: connection,
      timestamps: true,
      underscored:false
    });
  }

export default Chat ;



  

  