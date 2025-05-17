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
          'cancelled', // order cancelled by client
          'inProgress', // order is being processed by merchant
          'completed', // order has been completed by merchant
          'pending' // order not accepted by merchant
        ),
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
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      distance: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amountOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      transactionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
