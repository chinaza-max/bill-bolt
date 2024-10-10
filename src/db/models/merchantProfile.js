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



    

    