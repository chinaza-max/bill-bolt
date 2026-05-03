import { Model, DataTypes } from 'sequelize';

class MerchantAds extends Model {}

export function init(connection) {
  MerchantAds.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      minAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      maxAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pricePerThousand: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NGN',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'MerchantAds',
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

export default MerchantAds;
