  import { Model, DataTypes } from "sequelize";


  class PropertyManager extends Model {}

  export function init(connection) {
    PropertyManager.init(
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
        userId: {
          type: DataTypes.INTEGER,
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
          defaultValue:false ,
        }
      }, {
        tableName: 'PropertyManager',
        sequelize: connection,
        timestamps: true,
        underscored:false
    });
  }

  export default PropertyManager;



    

    