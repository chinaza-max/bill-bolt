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
        displayname: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        settlementAccount: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        bankCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        accoutTier: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        passCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        notificationAllowed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue:true
        },   
        disableAccount: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue:false
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



    

    