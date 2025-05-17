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
      merchantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      virtualAccount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sessionIdVirtualAcct: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderAmount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paymentReference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transactionType: {
        type: DataTypes.ENUM('order', 'widthdrawal', 'fundwallet'),
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM(
          'successful',
          'pending',
          'failed',
          'overpaid',
          'underpaid'
        ),
        allowNull: false,
      },
      paymentGateStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transactionFrom: {
        type: DataTypes.ENUM('wallet', 'external'),
        allowNull: false,
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
