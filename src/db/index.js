import { Sequelize } from 'sequelize';
import serverConfig from '../config/server.js';
import { init as initModels } from './models/index.js';
import fs from 'fs';

class DB {
  constructor() {
    this.sequelize;
  }

  async connectDB() {
    if (serverConfig.NODE_ENV === 'development') {
      //console.log('Connecting to database in development mode...');
      const options = {
        // logging: console.log,
        dialect: 'mysql',
        host: serverConfig.DB_HOST,
        username: serverConfig.DB_USERNAME,
        password: serverConfig.DB_PASSWORD,
        port: Number(serverConfig.DB_PORT),
        database: serverConfig.DB_NAME,
        logQueryParameters: true,
        /*
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
      await this.sequelize.sync();
      await this.alterOrderTableDirectly();

      /*
      try {
        await this.sequelize.query(
          `ALTER TABLE \`User\` DROP COLUMN \`loginMethodHistory\``
        );
        console.log('Dropped loginMethodHistory');
      } catch (e) {
        if (e.original?.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log('loginMethodHistory already dropped, skipping');
        } else throw e;
      }

      try {
        await this.sequelize.query(
          `ALTER TABLE \`User\` DROP COLUMN \`lastLoginMethod\``
        );
        console.log('Dropped lastLoginMethod');
      } catch (e) {   
        if (e.original?.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log('lastLoginMethod already dropped, skipping');
        } else throw e;
      }
      */
      //await this.sequelize.sync({ alter: true });
      // Compares models with existing tables and automatically updates the schema.
      // Adds or modifies columns to match models without dropping tables.
      // Useful in development, but risky for production because it may change structure unexpectedly.

      // await this.sequelize.sync({ force: true });
      // Drops all existing tables and recreates them from models.
      // This deletes ALL data in the tables.
      // Only use for development or when resetting the database completely.

      // await this.sequelize.sync({ logging: console.log });
      // Shows the raw SQL queries Sequelize executes during sync.
      // Useful for debugging database schema issues.

      //  await this.updateExistingTransactionIds();
      //  await this.updateEmptyDisplayNames();
      /*   try {
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
*/
    } else if (serverConfig.NODE_ENV === 'production') {
      const options = {
        // logging: console.log,
        dialect: 'mysql',
        host: serverConfig.DB_HOST,
        username: serverConfig.DB_USERNAME,
        password: serverConfig.DB_PASSWORD,
        port: Number(serverConfig.DB_PORT),
        database: serverConfig.DB_NAME,
        logQueryParameters: true,
      };

      if (process.env.DB_SSL === 'true' && fs.existsSync('./certs/aiven-ca.pem')) {
        options.dialectOptions = {
          ssl: {
            ca: fs.readFileSync('./certs/aiven-ca.pem'),
            rejectUnauthorized: true,
          },
        };
      }

      this.sequelize = new Sequelize(
        serverConfig.DB_NAME,
        serverConfig.DB_USERNAME,
        serverConfig.DB_PASSWORD,
        options
      );
      initModels(this.sequelize);
      await this.sequelize.sync();
      await this.alterOrderTableDirectly();
      //await this.alterOrderTableDirectly();

      //   await this.sequelize.sync({ force: true }); // ⚠️ deletes all data

      // await this.sequelize.sync({ force: true });
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
  /*

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
  */
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
  //
  generateUniqueTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN_${timestamp}_${random}`;
  }

  async alterOrderTableDirectly() {
    const columnsToAdd = [
      { name: 'orderType', definition: "ENUM('normal', 'special') NOT NULL DEFAULT 'normal'" },
      { name: 'requestId', definition: 'VARCHAR(255) NULL' },
      { name: 'paymentStatus', definition: "ENUM('pending', 'paid', 'refunded') NULL DEFAULT 'pending'" },
      { name: 'completedAt', definition: 'DATETIME NULL' },
      { name: 'cancelledAt', definition: 'DATETIME NULL' },
      { name: 'amount', definition: 'INTEGER NULL' },
      { name: 'denominationId', definition: 'INTEGER NULL' },
      { name: 'merchantCharge', definition: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'transportationCharge', definition: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'companyCharge', definition: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'chargeBearer', definition: "ENUM('Customer', 'Merchant', 'Both') NOT NULL DEFAULT 'Customer'" },
      { name: 'deliveryLat', definition: 'VARCHAR(255) NULL' },
      { name: 'deliveryLng', definition: 'VARCHAR(255) NULL' },
      { name: 'deliveryAddress', definition: 'VARCHAR(255) NULL' },
      { name: 'verificationOtp', definition: 'VARCHAR(255) NULL' }
    ];

    for (const col of columnsToAdd) {
      try {
        await this.sequelize.query(`ALTER TABLE \`Order\` ADD \`${col.name}\` ${col.definition};`);
      } catch (err) {
        // Silently catch if column already exists (Error 1060: Duplicate column name)
        if (err.original?.errno !== 1060 && !err.message.includes('Duplicate column')) {
          console.error(`[DB Alter] Error adding column ${col.name}:`, err.message);
        }
      }
    }

    // Modify existing columns to allow NULL for Special Withdrawal compatibility
    const columnsToModify = [
      { name: 'amountOrder', definition: 'VARCHAR(255) NULL' },
      { name: 'totalAmount', definition: 'VARCHAR(255) NULL' },
      { name: 'qrCodeHash', definition: 'VARCHAR(255) NULL' },
      { name: 'transactionId', definition: 'INTEGER NULL' },
      { name: 'moneyStatus', definition: "ENUM('received', 'refund', 'paid') NULL" }
    ];

    for (const col of columnsToModify) {
      try {
        await this.sequelize.query(`ALTER TABLE \`Order\` MODIFY \`${col.name}\` ${col.definition};`);
      } catch (err) {
        console.error(`[DB Alter] Error modifying column ${col.name}:`, err.message);
      }
    }

    try {
      await this.sequelize.query(
        "ALTER TABLE `MerchantSpecialWithdrawalProfile` MODIFY `serviceStatus` ENUM('Pending', 'Active', 'Suspended', 'Disabled') NOT NULL DEFAULT 'Pending';"
      );
    } catch (err) {
      console.error('[DB Alter] Error modifying serviceStatus column:', err.message);
    }

    // ─── IDENTITY VERIFICATION: Add new Setting columns ───────────────
    const settingColumnsToAdd = [
      { name: 'ninVerificationEnabled', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'ninImageUploadEnabled', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'nameVerificationEnabled', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'faceVerificationEnabled', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'specialWithdrawalEnabled', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
      { name: 'defaultTransportationPricePerMeter', definition: 'DOUBLE NOT NULL DEFAULT 0.0' },
      { name: 'specialWithdrawalCompanyChargePercentage', definition: 'DOUBLE NOT NULL DEFAULT 0.0' },
      { name: 'specialWithdrawalChargeBearer', definition: "ENUM('Customer', 'Merchant', 'Both') NOT NULL DEFAULT 'Customer'" },
      { name: 'specialWithdrawalDefaultCurrency', definition: "VARCHAR(255) NOT NULL DEFAULT 'NGN'" },
      { name: 'ninVerificationAmount', definition: 'DOUBLE NOT NULL DEFAULT 60.0' },
      { name: 'identityDebitAccountNumber', definition: 'VARCHAR(255) NULL' },
    ];

    for (const col of settingColumnsToAdd) {
      try {
        await this.sequelize.query(
          `ALTER TABLE \`Setting\` ADD \`${col.name}\` ${col.definition};`
        );
        console.log(`[DB Alter] Added Setting.${col.name}`);
      } catch (err) {
        if (err.original?.errno !== 1060 && !err.message.includes('Duplicate column')) {
          console.error(`[DB Alter] Error adding Setting.${col.name}:`, err.message);
        }
      }
    }

    // ─── USER TABLE: Add missing columns ─────────────────────────────
    const userColumnsToAdd = [
      { name: 'state', definition: 'VARCHAR(255) NULL' },
      { name: 'googleId', definition: 'VARCHAR(255) NULL UNIQUE' },
      { name: 'lastLoginMethod', definition: "ENUM('password', 'google') NULL" },
      { name: 'isNinVerified', definition: 'TINYINT(1) NULL DEFAULT 0' },
      { name: 'isDisplayNameMerchantSet', definition: 'TINYINT(1) NULL DEFAULT 0' },
      { name: 'isFaceVerified', definition: 'TINYINT(1) NULL DEFAULT 0' },
      { name: 'ninImage', definition: 'VARCHAR(255) NULL' },
      { name: 'isninImageVerified', definition: 'TINYINT(1) NULL DEFAULT 0' },
      { name: 'settlementAccount', definition: 'VARCHAR(255) NULL' },
      { name: 'bankCode', definition: 'VARCHAR(255) NULL' },
      { name: 'bankName', definition: 'VARCHAR(255) NULL' },
      { name: 'nameEnquiryReference', definition: 'VARCHAR(255) NULL' },
      { name: 'accountName', definition: 'VARCHAR(255) NULL' },
      { name: 'lat', definition: 'VARCHAR(255) NULL' },
      { name: 'lng', definition: 'VARCHAR(255) NULL' },
      { name: 'dateOfBirth', definition: 'DATETIME NULL' },
      { name: 'passCode', definition: 'VARCHAR(255) NULL' },
      { name: 'nin', definition: 'VARCHAR(255) NULL' },
      { name: 'ninName', definition: 'VARCHAR(255) NULL' },
      { name: 'describeYou', definition: 'VARCHAR(255) NULL' },
      { name: 'merchantActivated', definition: 'TINYINT(1) NULL DEFAULT 0' },
      { name: 'isOnline', definition: 'TINYINT(1) NULL DEFAULT 0' },
      { name: 'deviceType', definition: "ENUM('android', 'ios') NULL" },
      { name: 'deviceIp', definition: 'VARCHAR(255) NULL' },
      { name: 'disableAccount', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
      { name: 'refreshToken', definition: 'TEXT NULL' },
      { name: 'fcmToken', definition: 'TEXT NULL' },
      { name: 'canWithdraw', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
      { name: 'notificationId', definition: 'TEXT NULL' },
      { name: 'notificationAllowed', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    ];

    for (const col of userColumnsToAdd) {
      try {
        await this.sequelize.query(
          `ALTER TABLE \`User\` ADD \`${col.name}\` ${col.definition};`
        );
        console.log(`[DB Alter] Added User.${col.name}`);
      } catch (err) {
        if (err.original?.errno !== 1060 && !err.message.includes('Duplicate column')) {
          console.error(`[DB Alter] Error adding User.${col.name}:`, err.message);
        }
      }
    }

    // ─── NIN OTP VALIDATION: Add missing columns ─────────────────────
    const ninOtpColumnsToAdd = [
      { name: 'csrfToken', definition: 'VARCHAR(500) NULL' },
      { name: 'withdrawalToken', definition: 'VARCHAR(500) NULL' },
      { name: 'pendingPayload', definition: 'JSON NULL' },
    ];

    for (const col of ninOtpColumnsToAdd) {
      try {
        await this.sequelize.query(
          `ALTER TABLE \`NINOTPValidation\` ADD \`${col.name}\` ${col.definition};`
        );
        console.log(`[DB Alter] Added NINOTPValidation.${col.name}`);
      } catch (err) {
        if (err.original?.errno !== 1060 && !err.message.includes('Duplicate column')) {
          console.error(`[DB Alter] Error adding NINOTPValidation.${col.name}:`, err.message);
        }
      }
    }

    // ─── IDENTITY VERIFICATION: Create IdentityClient table ──────────
    try {
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`IdentityClient\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`companyName\` VARCHAR(255) NOT NULL,
          \`cacNumber\` VARCHAR(255) NULL,
          \`address\` VARCHAR(255) NOT NULL,
          \`contactName\` VARCHAR(255) NOT NULL,
          \`email\` VARCHAR(255) NOT NULL UNIQUE,
          \`password\` VARCHAR(255) NOT NULL,
          \`phoneNumber\` VARCHAR(255) NULL,
          \`apiKey\` VARCHAR(255) NOT NULL UNIQUE,
          \`walletBalance\` DOUBLE NOT NULL DEFAULT 0.0,
          \`webhookUrl\` VARCHAR(500) NULL,
          \`isEmailVerified\` TINYINT(1) NOT NULL DEFAULT 0,
          \`emailOtp\` VARCHAR(255) NULL,
          \`emailOtpExpiresAt\` DATETIME NULL,
          \`status\` ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'pending',
          \`isDeleted\` TINYINT(1) NOT NULL DEFAULT 0,
          \`createdAt\` DATETIME NOT NULL,
          \`updatedAt\` DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('[DB Alter] IdentityClient table created (or already exists)');
    } catch (err) {
      console.error('[DB Alter] Error creating IdentityClient table:', err.message);
    }

    // ─── IDENTITY CLIENT: Add missing columns ─────────────────────────
    const identityClientColumnsToAdd = [
      { name: 'isEmailVerified', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
      { name: 'emailOtp', definition: 'VARCHAR(255) NULL' },
      { name: 'emailOtpExpiresAt', definition: 'DATETIME NULL' },
    ];

    for (const col of identityClientColumnsToAdd) {
      try {
        await this.sequelize.query(
          `ALTER TABLE \`IdentityClient\` ADD \`${col.name}\` ${col.definition};`
        );
        console.log(`[DB Alter] Added IdentityClient.${col.name}`);
      } catch (err) {
        if (err.original?.errno !== 1060 && !err.message.includes('Duplicate column')) {
          console.error(`[DB Alter] Error adding IdentityClient.${col.name}:`, err.message);
        }
      }
    }

    try {
      await this.sequelize.query(
        "ALTER TABLE `IdentityClient` MODIFY COLUMN `status` ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'pending';"
      );
    } catch (err) {
      console.error('[DB Alter] Error modifying IdentityClient.status column:', err.message);
    }

    // ─── IDENTITY VERIFICATION: Create IdentityTransaction table ─────
    try {
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`IdentityTransaction\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`clientId\` INT NOT NULL,
          \`transactionId\` VARCHAR(255) NOT NULL UNIQUE,
          \`reference\` VARCHAR(255) NULL,
          \`type\` ENUM('funding', 'verification_nin', 'verification_bvn', 'refund') NOT NULL,
          \`amount\` DOUBLE NOT NULL DEFAULT 0.0,
          \`previousBalance\` DOUBLE NOT NULL DEFAULT 0.0,
          \`newBalance\` DOUBLE NOT NULL DEFAULT 0.0,
          \`paymentStatus\` ENUM('pending', 'successful', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
          \`identityNumber\` VARCHAR(255) NULL,
          \`identityId\` VARCHAR(255) NULL,
          \`debitAccountNumber\` VARCHAR(255) NULL,
          \`virtualAccountId\` VARCHAR(255) NULL,
          \`sessionIdVirtualAcct\` VARCHAR(255) NULL,
          \`virtualAccountDetails\` JSON NULL,
          \`providerResponse\` JSON NULL,
          \`isDeleted\` TINYINT(1) NOT NULL DEFAULT 0,
          \`createdAt\` DATETIME NOT NULL,
          \`updatedAt\` DATETIME NOT NULL,
          FOREIGN KEY (\`clientId\`) REFERENCES \`IdentityClient\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('[DB Alter] IdentityTransaction table created (or already exists)');
    } catch (err) {
      console.error('[DB Alter] Error creating IdentityTransaction table:', err.message);
    }
  }
}

export default new DB();
