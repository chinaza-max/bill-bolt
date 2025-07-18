import { Model, DataTypes } from 'sequelize';
import crypto from 'crypto';

class Transaction extends Model {

   static generateUniqueTransactionId() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TXN_${timestamp}_${random}`;
  }
}

export function init(connection) {
  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      hooks: {
        beforeCreate: async (transaction, options) => {
          // Generate transactionId if it's null or empty
          if (!transaction.transactionId || transaction.transactionId.trim() === '') {
            transaction.transactionId = Transaction.generateUniqueTransactionId();
          }
        },
        beforeUpdate: async (transaction, options) => {
          // Generate transactionId if it's being set to null or empty
          if (!transaction.transactionId || transaction.transactionId.trim() === '') {
            transaction.transactionId = Transaction.generateUniqueTransactionId();
          }
        },
      },
    }
  );
}

export default Transaction;
