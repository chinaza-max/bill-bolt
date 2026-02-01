import { Sequelize, Op } from 'sequelize';
import serverConfig from '../config/server.js';
import {
  init as initModels,
  Transaction,
  MerchantProfile,
} from './models/index.js';
import fs from 'fs';

class DB {
  constructor() {
    this.sequelize;
  }

  async connectDB() {
    const options = {
      // logging: console.log,
      dialect: 'mysql',
      host: serverConfig.DB_HOST,
      username: serverConfig.DB_USERNAME,
      password: serverConfig.DB_PASSWORD,
      port: Number(serverConfig.DB_PORT),
      database: serverConfig.DB_NAME,
      logQueryParameters: true,

      dialectOptions: {
        ssl: {
          ca: fs.readFileSync('./certs/aiven-ca.pem'),
          rejectUnauthorized: true,
        },
      },
      /*  pool: {
        max: 4, // Maximum number of connections in the poo
        min: 0, // Minimum number of connections in  the pool
        acquire: 30000, // The maximum time, in milliseconds, that pool will try to get a connection before throwing an error
        idle: 10000, // The maximum time, in milliseconds, that a connection can be idle before being released
      },*/
    };

    this.sequelize = new Sequelize(
      serverConfig.DB_NAME,
      serverConfig.DB_USERNAME,
      serverConfig.DB_PASSWORD,
      options
    );

    initModels(this.sequelize);

    if (serverConfig.NODE_ENV === 'development') {
      await this.sequelize.sync();

      //await this.sequelize.sync({ alter: true });
      //await this.sequelize.sync({ force: true });
      //  await this.updateExistingTransactionIds();
      //  await this.updateEmptyDisplayNames();
      try {
        await this.sequelize.query(`
          ALTER TABLE MerchantProfile 
          CHANGE COLUMN accoutTier accountTier INTEGER NOT NULL;
        `);
        console.log('Column name updated: accoutTier → accountTier');
      } catch (error) {
        if (error.original && error.original.code === 'ER_BAD_FIELD_ERROR') {
          console.warn('Column accoutTier does not exist, skipping rename.');
        } else {
          console.error('Error updating column name:', error);
        }
      }
    }

    /*S   try {
      await this.sequelize.query(`
  ALTER TABLE MerchantProfile
  CHANGE COLUMN displayname displayName VARCHAR(255) NOT NULL;
`);
      console.log('Column name updated: displayname → displayName');
    } catch (error) {
      if (error.original && error.original.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('Column accoutTier does not exist, skipping rename.');
      } else {
        console.error('Error updating column name:', error);
      }
    }*/

    /*      
        (async () => {
          try {  
            const [results] = await this.sequelize.query('SHOW TABLES;');
            const tables = results.map(result => result.Tables_in_your_database_name);
            console.log('List of tables:', tables);
          } catch (error) {
            console.error('Error retrieving tables:', error);
          } finally {
            await this.sequelize.close();
          }
        })();
*/
    /*
        const disableForeignKeyChecks = 'SET foreign_key_checks = 0;';
const dropTable = 'DROP TABLE IF EXISTS WishList;';
const enableForeignKeyChecks = 'SET foreign_key_checks = 1;';

// Execute SQL commands
this.sequelize.query(disableForeignKeyChecks)
  .then(() => this.sequelize.query(dropTable))
  .then(() => this.sequelize.query(enableForeignKeyChecks))
  .then(() => {
    console.log('Table dropped successfully.');
    console.log('Table dropped successfully.');
    console.log('Table dropped successfully.');
    console.log('Table dropped successfully.');
    console.log('Table dropped successfully.');
    console.log('Table dropped successfully.');

  })
  .catch((error) => {
    console.error('Error dropping table:', error);
  });
*/
  }
  async updateExistingTransactionIds() {
    try {
      // Find all transactions with null or empty transactionId
      const transactionsToUpdate = await Transaction.findAll({
        where: {
          [this.sequelize.Op.or]: [
            { transactionId: null },
            { transactionId: '' },
          ],
        },
      });

      console.log(
        `Found ${transactionsToUpdate.length} transactions with missing transactionId`
      );

      // Update each transaction with a unique ID
      for (const transaction of transactionsToUpdate) {
        const newTransactionId = this.generateUniqueTransactionId();
        await transaction.update({ transactionId: newTransactionId });
        console.log(
          `Updated transaction ${transaction.id} with new transactionId: ${newTransactionId}`
        );
      }

      console.log('All existing transactions updated successfully.');
    } catch (error) {
      console.error('Error updating existing transaction IDs:', error);
    }
  }
  /*
  async updateEmptyDisplayNames(sequelize) {
    try {
      // Find all merchant profiles with empty or null displayName
      await MerchantProfile.update(
        { displayName: 'sharp guy' },
        {
          where: {
            [Op.or]: [{ displayName: null }, { displayName: '' }],
          },
        }
      );

      const stillEmpty = await MerchantProfile.findAll({
        where: {
          [Op.or]: [{ displayName: null }, { displayName: '' }],
        },
      });

      console.log(
        `${stillEmpty.length} profiles still have empty displayName.`
      );

      console.log('All empty displayNames updated successfully.');
    } catch (error) {
      console.error('Error updating display names:', error);
    }
  }*/

  generateUniqueTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN_${timestamp}_${random}`;
  }
}

export default new DB();
