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
        type: DataTypes.ENUM('NIN'),
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
      tableName: 'NINOTPValidation', // Renamed the table to reflect NIN OTP
      sequelize: connection,
      timestamps: true,
      underscored: false,

      indexes: [
        {
          unique: true,
          fields: ['userId', 'validateFor'],
        },
      ],
    }
  );
}

export default NINOTPValidation;
