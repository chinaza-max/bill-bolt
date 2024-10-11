import {
    DataTypes,
    Model
  } from "sequelize";


  class EmailandTelValidation extends Model {}

  export function init(connection) {
    EmailandTelValidation.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }, 
      type: {
        type: DataTypes.ENUM(
          'email',
          'tel'
        ),
        allowNull: false,
      },
      validateFor: {
        type: DataTypes.ENUM(
          'user',
          'admin'
        ),
        allowNull: false,
      },
      verificationCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expiresIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      }
    }, {
      tableName: 'EmailandTelValidation',
      sequelize: connection,
      timestamps: true,
      underscored:false,

      indexes: [
        {
          unique: true,
          fields: ['userId', 'validateFor']
        }
      ]
    });
  }



export default EmailandTelValidation ;



  

  