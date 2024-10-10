import { Model, DataTypes } from "sequelize";


class User extends Model {}

export function init(connection) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      emailAddress: {    
        type: DataTypes.STRING,
        allowNull: false,
      },
      isEmailValid: {
        type: DataTypes.BOOLEAN,
        defaultValue:false,
        allowNull: false,
      },
      tel: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isTelValid: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      telCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      }, 
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      }, 
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      merchantActivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      disableAccount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
      },
      notificationAllowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:true
      },   
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false ,
      }
    }, {
      tableName: 'User',
      sequelize: connection,
      timestamps: true,
      underscored:false
  });
  }

export default User ;



  

  