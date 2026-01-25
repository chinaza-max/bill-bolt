import { DataTypes, Model } from 'sequelize';

class PinReset extends Model {}

export function init(connection) {
  PinReset.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      expiresIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'PinReset',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default PinReset;
