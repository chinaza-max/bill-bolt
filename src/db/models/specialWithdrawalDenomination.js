import { Model, DataTypes } from 'sequelize';

class SpecialWithdrawalDenomination extends Model {}

export function init(connection) {
  SpecialWithdrawalDenomination.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NGN',
      },
      isEnabled: {
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
      tableName: 'SpecialWithdrawalDenomination',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default SpecialWithdrawalDenomination;
