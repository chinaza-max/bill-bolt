import db from '../src/db/index.js';
import { User, Orders, Setting } from '../src/db/models/index.js';

async function runSync() {
  console.log('----------------------------------------------------');
  console.log('🔄 STARTING DATABASE SCHEMA SYNCHRONIZATION');
  console.log('----------------------------------------------------');

  try {
    // 1. Establish connection and run non-destructive sync + ALTER statements
    await db.connectDB();

    console.log('\n----------------------------------------------------');
    console.log('✅ DATABASE SCHEMA SYNC COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');

    // 2. Empirical Verification: Verify existing user data intact
    const userCount = await User.count();
    const orderCount = await Orders.count();
    const settingCount = await Setting.count();

    console.log('\n📊 POST-SYNC VERIFICATION STATS:');
    console.log(`- Existing Users in Database: ${userCount}`);
    console.log(`- Existing Orders in Database: ${orderCount}`);
    console.log(`- Setting Configuration Records: ${settingCount}`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Sync Failed:', error);
    process.exit(1);
  }
}

runSync();
