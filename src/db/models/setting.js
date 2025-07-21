import { Model, DataTypes } from 'sequelize';

class Setting extends Model {}

export function init(connection) {
  Setting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      distanceThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      validFor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 900,
      },
      walletBalance: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          previous: 0,
          current: 0,
        },
      },
      callbackUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https/',
      },
      maxOrderPerMerchant: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      tiers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      gateWayEnvironment: {
        type: DataTypes.ENUM('sandBox', 'live'),
        allowNull: false,
        defaultValue: 'sandBox',
      },
      activeGateway: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'safeHaven.gateway',
      },
      isMatchRunning: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defaultAds: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      gatewayService: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      serviceCharge: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      gatewayList: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      breakPoint: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      matchStartedAt:{
        type: DataTypes.DATE,
        allowNull: true, 
      }
    },
    {
      tableName: 'Setting', // The table name
      sequelize: connection,
      timestamps: true, // Adds createdAt and updatedAt fields
      underscored: false,
    }
  );
}

export default Setting;
