import { Model, DataTypes } from 'sequelize';

class Mymatch extends Model {}

export function init(connection) {
  Mymatch.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      matches: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'Mymatch',
      sequelize: connection,
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['userId'],
        },
      ],
    }
  );
}

export default Mymatch;
