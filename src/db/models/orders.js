import { Model, DataTypes } from 'sequelize';

class Order extends Model {}

export function init(connection) {
  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderStatus: {
        type: DataTypes.ENUM(
          'cancelled', // order cancelled by client or merchant
          'rejected', // order rejected by merchant
          'inProgress', // order is being processed by merchant
          'completed', // order has been completed by merchant
          'pending' // order not accepted by merchant
        ),
        defaultValue: 'pending',
        allowNull: false,
      },
      moneyStatus: {
        type: DataTypes.ENUM(
          'received', // money has beeen received in escrow
          'refund', // cancelled order
          'paid' // money paid to merchant
        ),
        allowNull: false,
      },
      transactionTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      distance: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amountOrder: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      qrCodeHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      hasIssues: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: false,
      },
      transactionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'Order',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default Order;
