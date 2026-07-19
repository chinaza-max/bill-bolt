import { Model, DataTypes } from 'sequelize';

class MerchantDenominationCharge extends Model {}

export function init(connection) {
  MerchantDenominationCharge.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      denominationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      charge: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'MerchantDenominationCharge',
      sequelize: connection,
      timestamps: true,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['merchantId', 'denominationId'],
        },
        {
          fields: ['merchantId'],
        },
      ],
    }
  );
}

export default MerchantDenominationCharge;
