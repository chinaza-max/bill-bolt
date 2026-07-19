import { Model, DataTypes } from 'sequelize';

class MerchantSpecialWithdrawalProfile extends Model {}

export function init(connection) {
  MerchantSpecialWithdrawalProfile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      minWithdrawalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxWithdrawalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000000,
      },
      autoAccept: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      serviceStatus: {
        type: DataTypes.ENUM('Active', 'Suspended', 'Disabled'),
        allowNull: false,
        defaultValue: 'Active',
      },
      cashAvailability: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 5.0,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'MerchantSpecialWithdrawalProfile',
      sequelize: connection,
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['merchantId'],
        },
      ],
    }
  );
}

export default MerchantSpecialWithdrawalProfile;
