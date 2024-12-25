import { Model, DataTypes } from "sequelize";

class Setting extends Model {}

export function init(connection) {
  Setting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tiers: {
        type: DataTypes.JSON,  
        allowNull: false
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false ,
      }
    },
    {
      tableName: 'Setting', // The table name
      sequelize: connection,
      timestamps: true, // Adds createdAt and updatedAt fields
      underscored: false,
    }
  );
}

export default Setting;
