import { Model, DataTypes } from "sequelize";


class User extends Model {}

export function init(connection) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,        
        autoIncrement: true
      },
      emailAddress: {    
        type: DataTypes.STRING,
        allowNull: false
      },
      isEmailValid: {
        type: DataTypes.BOOLEAN,
        defaultValue:false, 
        allowNull: false
      },
      refundAccount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isTelValid: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      telCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      }, 
      country: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue:"NIGERIA"
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      }, 
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      passCode: {
        type: DataTypes.STRING,
        allowNull: true,      
      },
      describeYou: {
        type: DataTypes.STRING,  
        allowNull: true,
      },
      merchantActivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,    
        allowNull: true
      },
      disableAccount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notificationAllowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:true
      },   
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false,
      }
    }, {
      tableName: 'User',
      sequelize: connection,
      timestamps: true,
      underscored:false
  });
  }

export default User ;



  

  