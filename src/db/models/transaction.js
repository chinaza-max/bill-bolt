import { Model, DataTypes } from 'sequelize';

class Transaction extends Model {}

export function init(connection) {
  Transaction.init(
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
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      virtualAccount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sessionIdVirtualAcct: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      paymentReference: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      virtualAccount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      transactionType: {
        type: DataTypes.ENUM('order', 'widthdrawal', 'refund'),
        allowNull: false,
        defaultValue: 'order',
      },
      paymentStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'unverified',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'Transaction',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default Transaction;
