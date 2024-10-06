  import { Model, DataTypes } from "sequelize";


  class PropertyManager extends Model {}

  export function init(connection) {
    PropertyManager.init(
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
          defaultValue:false,
          allowNull: false,
        },
        tel: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        isTelValid: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        telCode: {
          type: DataTypes.STRING,
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
        lasrraId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        nin: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING,
          allowNull: true,
        }, 
        state: {
          type: DataTypes.STRING,
          allowNull: true,
        }, 
        lga: {
          type: DataTypes.STRING,
          allowNull: true,
        }, 
        lasrraId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        agentBankCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        agentBankAccount: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        landlordBankCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        landlordBankAccount: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM(
            'landLord',
            'agent',
            'unset',
          ),
          allowNull: false,
          defaultValue:'unset'
        },
        companyName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        agentRegistrationNO: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        role: {
          type: DataTypes.STRING,
          defaultValue: 'list',
        },
        disableAccount: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue:false
        },
        notificationAllowed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue:true
        },   
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue:false ,
        }
      }, {
        tableName: 'PropertyManager',
        sequelize: connection,
        timestamps: true,
        underscored:false
    });
  }

  export default PropertyManager;



    

    