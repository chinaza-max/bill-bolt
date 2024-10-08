  import { Model, DataTypes } from "sequelize";


  class MerchantProfile extends Model {}

  export function init(connection) {
    MerchantProfile.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        emailAddress: {
          type: DataTypes.STRING,
          allowNull: true,
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
        displayname: {
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
        tableName: 'MerchantProfile',
        sequelize: connection,
        timestamps: true,
        underscored:false
    });
  }

  export default MerchantProfile;



    

    