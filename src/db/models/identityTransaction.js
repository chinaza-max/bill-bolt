import { Model, DataTypes } from 'sequelize';

class IdentityTransaction extends Model {}

export function init(connection) {
  IdentityTransaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('funding', 'verification_nin', 'verification_bvn', 'refund'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0,
      },
      previousBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0,
      },
      newBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0,
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'successful', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      identityNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      identityId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      debitAccountNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      virtualAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sessionIdVirtualAcct: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      virtualAccountDetails: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      providerResponse: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'IdentityTransaction',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default IdentityTransaction;
