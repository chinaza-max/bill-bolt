import { Model, DataTypes } from 'sequelize';

class Complaint extends Model {}

export function init(connection) {
  Complaint.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        // The user who submitted the complaint (can be client or merchant)
        type: DataTypes.INTEGER,
        allowNull: false,
        comment:
          'ID of the user (client or merchant) who submitted the complaint',
      },
      orderId: {
        // The order related to the complaint, if applicable
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the order the complaint is associated with',
      },
      complaintType: {
        // Type of complaint, can be about the transaction, user behavior, etc.
        type: DataTypes.ENUM('transaction', 'user', 'service'),
        allowNull: false,
        comment: 'The type of complaint',
      },
      title: {
        // Title or subject of the complaint
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Title of the complaint',
      },
      complaintReason: {
        // Reason or description of the complaint
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Detailed reason for the complaint',
      },
      status: {
        // Status of the complaint (open, under investigation, resolved, etc.)
        type: DataTypes.ENUM('open', 'inProgress', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'open',
        comment: 'The current status of the complaint',
      },
      view: {
        // Status of the complaint (open, under investigation, resolved, etc.)
        type: DataTypes.ENUM('seen', 'unseen'),
        allowNull: false,
        defaultValue: 'unseen',
        comment: 'The current status of the complaint',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'Complaint',
      sequelize: connection,
      timestamps: true,
      underscored: false,
    }
  );
}

export default Complaint;
