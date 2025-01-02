import { Model, DataTypes } from "sequelize";

class Order extends Model {}

export function init(connection) {
  Order.init(
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
      merchantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderStatus: {
        type: DataTypes.ENUM(
            'cancelled',
            'inProgress',
            'completed',
          ),
        allowNull: false,
      },
      moneyStatus: {
        type: DataTypes.ENUM(
            'pending',// order created money has not been received
            'received',// money has beeen received be merchant
            'refund',// cancelled order
            'paid'// money paid to merchant 
          ),
        allowNull: false,
        defaultValue:'pending',
      },
      transactionTime: {
        type: DataTypes.FLOAT,
        allowNull: true,
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
        defaultValue: false
      },  
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: false
      },
      transactionId: { 
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false,
      }
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
