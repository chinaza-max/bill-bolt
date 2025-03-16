import { Model, DataTypes } from 'sequelize';

class User extends Model {}

export function init(connection) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue:
          'https://res.cloudinary.com/dvznn9s4g/image/upload/v1740438988/avatar_phzyrn.jpg',
      },
      emailAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isEmailValid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      settlementAccount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
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
      lat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lng: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NIGERIA',
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
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
      nin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ninName: {
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
        allowNull: true,
      },
      isNinVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isDisplayNameMerchantSet: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isFaceVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deviceType: {
        type: DataTypes.ENUM('android', 'ios'),
        allowNull: true,
      },
      deviceIp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      disableAccount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      walletBalance: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          previous: 0,
          current: 0,
        },
      },
      notificationId: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notificationAllowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'User',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default User;
