import { Model, DataTypes } from 'sequelize';

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
      accountStatus: {
        type: DataTypes.ENUM('active', 'processing', 'notActive', 'rejected'),
        allowNull: false,
        defaultValue: 'processing',
      },
      deliveryRange: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '10',
      },
      walletBalance: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          previous: 0,
          current: 0,
        },
      },
      notificationAllowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      disableAccount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'MerchantProfile',
      sequelize: connection,
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['userId'],
        },
      ],
    }
  );
}

export default MerchantProfile;
