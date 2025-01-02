import User, { init as initUser } from './user.js';
import MerchantProfile, {
  init as initMerchantProfile,
} from './merchantProfile.js';
import Chat, { init as initChat } from './chat.js';
import EmailandTelValidation, {
  init as initEmailandTelValidation,
} from './emailAndTelValidation.js';
import PasswordReset, { init as initPasswordReset } from './passwordReset.js';
import MerchantAds, { init as initMerchantAds } from './merchantAds.js';
import Complaint, { init as initComplaint } from './complaint.js';
import Orders, { init as initOrders } from './orders.js';
import Setting, { init as initSetting } from './setting.js';
import Mymatch, { init as initMymatch } from './mymatch.js';
import Transaction, { init as initTransaction } from './transaction.js';

function associate() {
  User.hasOne(MerchantProfile, {
    foreignKey: 'userId',
    as: 'MerchantProfile',
  });
  MerchantProfile.belongsTo(User, {
    foreignKey: 'userId',
  });

  User.hasOne(Mymatch, {
    foreignKey: 'userId',
    as: 'UserMatch',
  });
  Mymatch.belongsTo(User, {
    foreignKey: 'userId',
  });

  User.hasOne(MerchantAds, {
    foreignKey: 'userId',
    as: 'UserMerchantAds',
  });
  MerchantAds.belongsTo(User, {
    foreignKey: 'userId',
  });

  User.hasMany(Orders, {
    foreignKey: 'clientId',
    as: 'clientOrder',
  });
  Orders.belongsTo(User, {
    foreignKey: 'clientId',
  });

  User.hasMany(Orders, {
    foreignKey: 'merchantId',
    as: 'merchantOrder',
  });
  Orders.belongsTo(User, {
    foreignKey: 'merchantId',
  });

  User.hasMany(Chat, {
    foreignKey: 'userId1',
    as: 'userId1Chat',
  });
  Chat.belongsTo(User, {
    foreignKey: 'userId1',
  });

  User.hasMany(Chat, {
    foreignKey: 'userId2',
    as: 'userId2Chat',
  });
  Chat.belongsTo(User, {
    foreignKey: 'userId2',
  });

  //console.log(BusinessSpot.associations)
  //console.log(UserDate.associations)
}

async function authenticateConnection(connection) {
  try {
    await connection.authenticate();
    console.log('Connection to database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export {
  PasswordReset,
  EmailandTelValidation,
  MerchantProfile,
  Chat,
  MerchantAds,
  User,
  Complaint,
  Orders,
  Setting,
  Mymatch,
  Transaction,
};

export function init(connection) {
  initUser(connection);
  initChat(connection);
  initEmailandTelValidation(connection);
  initPasswordReset(connection);
  initMerchantProfile(connection);
  initMerchantAds(connection);
  initComplaint(connection);
  initOrders(connection);
  initSetting(connection);
  initMymatch(connection);
  initTransaction(connection);
  associate();
  authenticateConnection(connection);
}
