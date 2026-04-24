import { DataTypes, Model } from 'sequelize';

class NINOTPValidation extends Model {}

export function init(connection) {
  NINOTPValidation.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        // ✅ Added 'withdrawal' to the ENUM
        type: DataTypes.ENUM('NIN', 'withdrawal'),
        allowNull: false,
      },
      validateFor: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
      },
      verificationCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // ✅ NEW: CSRF token for withdrawal security
      csrfToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      // ✅ NEW: withdrawal session token
      withdrawalToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      // ✅ NEW: stores amount, bankCode etc server-side
      pendingPayload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expiresIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'NINOTPValidation',
      sequelize: connection,
      timestamps: true,
      underscored: false,

      indexes: [
        {
          // ✅ Updated unique index to include type
          // so NIN and withdrawal records don't conflict
          unique: true,
          fields: ['userId', 'validateFor', 'type'],
        },
      ],
    }
  );
}

export default NINOTPValidation;
