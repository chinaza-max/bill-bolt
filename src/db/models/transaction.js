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
      virtualAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      transactionType: {
        type: DataTypes.ENUM('order', 'withdrawal', 'fundwallet'),
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM(
          'successful',
          'pending',
          'failed',
          'overpaid',
          'underpaid',
          'reversed',
          'cancelled'
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

      // ─── NEW FIELDS ──────────────────────────────────────────────

      // Stores: { sessionId, nameEnquiryReference, provider, providerChannel,
      //           providerChannelCode, destinationInstitutionCode, responseCode, responseMessage }
      gatewayMeta: {
        type: DataTypes.JSON,
        allowNull: true,
        comment:
          'Provider/gateway-level metadata: sessionId, nameEnquiryRef, provider, channel, response codes, etc.',
      },

      // Stores: { name, accountNumber, bankVerificationNumber, kycLevel }
      debitParty: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Sender account details from the gateway response.',
      },

      // Stores: { name, accountNumber, bankVerificationNumber, kycLevel }
      creditParty: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Receiver account details from the gateway response.',
      },

      // Stores: { fees, vat, stampDuty }
      charges: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Breakdown of fees, VAT, and stamp duty.',
      },

      narration: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      transactionLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Lat,Lng string from gateway e.g. "9.0932,7.4429"',
      },

      isReversed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      reversalReference: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      declinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // ─────────────────────────────────────────────────────────────

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
        beforeCreate: async (transaction) => {
          if (
            !transaction.transactionId ||
            transaction.transactionId.trim() === ''
          ) {
            transaction.transactionId =
              Transaction.generateUniqueTransactionId();
          }
        },
        beforeUpdate: async (transaction) => {
          if (
            !transaction.transactionId ||
            transaction.transactionId.trim() === ''
          ) {
            transaction.transactionId =
              Transaction.generateUniqueTransactionId();
          }
        },
      },
    }
  );
}

export default Transaction;
