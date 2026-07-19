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
      orderType: {
        type: DataTypes.ENUM('normal', 'special'),
        allowNull: false,
        defaultValue: 'normal',
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      requestId: {
        type: DataTypes.STRING,
        allowNull: true,
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
          'pending', // order not accepted by merchant
          'accepted' // special withdrawal request accepted
        ),
        defaultValue: 'pending',
        allowNull: false,
      },
      moneyStatus: {
        type: DataTypes.ENUM(
          'received', // money has been received in escrow
          'refund', // cancelled order
          'paid' // money paid to merchant
        ),
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded'),
        allowNull: true,
        defaultValue: 'pending',
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
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelledAt: {
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
        allowNull: true,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      qrCodeHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hasIssues: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      transactionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      denominationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      merchantCharge: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      transportationCharge: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      companyCharge: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      chargeBearer: {
        type: DataTypes.ENUM('Customer', 'Merchant', 'Both'),
        allowNull: false,
        defaultValue: 'Customer',
      },
      deliveryLat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryLng: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      verificationOtp: {
        type: DataTypes.STRING,
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
