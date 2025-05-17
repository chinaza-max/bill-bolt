import { Model, DataTypes } from 'sequelize';

class Admin extends Model {}

export function init(connection) {
  Admin.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      emailAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isEmailValid: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'admin',
      },
      privilege: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      disableAccount: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notificationAllowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'Admin',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default Admin;
