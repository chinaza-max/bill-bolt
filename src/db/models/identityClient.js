import { Model, DataTypes } from 'sequelize';

class IdentityClient extends Model {}

export function init(connection) {
  IdentityClient.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cacNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      apiKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      walletBalance: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0,
      },
      webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'IdentityClient',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default IdentityClient;
