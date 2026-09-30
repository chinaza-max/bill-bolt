import { Model, DataTypes } from 'sequelize';

class UserPromoCredit extends Model {}

export function init(connection) {
  UserPromoCredit.init(
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
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      remainingAmount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      durationHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 48,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'used', 'expired', 'revoked'),
        allowNull: false,
        defaultValue: 'active',
      },
      narration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'UserPromoCredit',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default UserPromoCredit;
