import { Sequelize } from 'sequelize';
import serverConfig from '../config/server.js';
import { init as initModels } from './models/index.js';

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
      await this.sequelize.sync({ alter: true });
      //await this.sequelize.sync({ force: true });

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

    const queryInterface = this.sequelize.getQueryInterface();
    try {
      await queryInterface.removeConstraint('Order', 'Transaction_ibfk_2');
      console.log('Foreign key constraint removed: Transaction_ibfk_2');
    } catch (error) {
      if (error.original?.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.warn(
          'Foreign key Transaction_ibfk_2 does not exist, skipping.'
        );
      } else if (error.original?.code === 'ER_ROW_IS_REFERENCED') {
        console.error('Cannot drop FK: rows are referenced.');
      } else {
        console.error('Error dropping foreign key:', error);
      }
    }

    /*
    try {
      await this.sequelize.query(`
          ALTER TABLE \`Order\` DROP FOREIGN KEY Transaction_ibfk_2;
        `);
      console.log('Foreign key constraint removed: Transaction_ibfk_2');
    } catch (error) {
      if (error.original?.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.warn(
          'Foreign key Transaction_ibfk_2 does not exist, skipping.'
        );
      } else if (error.original?.code === 'ER_ROW_IS_REFERENCED') {
        console.error('Cannot drop FK: rows are referenced.');
      } else {
        console.error('Error dropping foreign key:', error);
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
}

export default new DB();
