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
import Mymatch, { init as initMymatch } from './myMatch.js';
import Transaction, { init as initTransaction } from './transaction.js';
import Admin, { init as initAdmin } from './admin.js';
import Notification, { init as initNotification } from './notification.js';
import NinOtp, { init as initNinOtp } from './ninOtp.js';
import PinReset, { init as initPinReset } from './pinReset.js';
import SpecialWithdrawalDenomination, {
  init as initSpecialWithdrawalDenomination,
} from './specialWithdrawalDenomination.js';
import MerchantSpecialWithdrawalProfile, {
  init as initMerchantSpecialWithdrawalProfile,
} from './merchantSpecialWithdrawalProfile.js';
import MerchantDenominationCharge, {
  init as initMerchantDenominationCharge,
} from './merchantDenominationCharge.js';


function associate() {
  User.hasOne(MerchantProfile, {
    foreignKey: 'userId',
    as: 'MerchantProfile',
  });
  MerchantProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'UserProfile',
  });

  User.hasMany(Transaction, {
    foreignKey: 'userId',
    as: 'UserTransaction',
  });
  Transaction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'TransactionUser',
  });

  Complaint.belongsTo(User, {
    foreignKey: 'userId',
    as: 'ComplaintUser',
  });
  User.hasMany(Complaint, {
    foreignKey: 'userId',
    as: 'UserComplaint',
  });

  Transaction.hasOne(Orders, {
    foreignKey: 'transactionId',
    as: 'OrderTransaction',
  });
  Orders.belongsTo(Transaction, {
    foreignKey: 'transactionId',
    as: 'TransactionOrder',
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
    as: 'ClientOrder',
  });
  Orders.belongsTo(User, {
    foreignKey: 'clientId',
    as: 'OrderClient',
  });

  User.hasMany(Orders, {
    foreignKey: 'merchantId',
    as: 'MerchantOrder',
  });
  Orders.belongsTo(User, {
    foreignKey: 'merchantId',
    as: 'OrderMerchant',
  });

  User.hasMany(Chat, {
    foreignKey: 'userId1',
    as: 'UserId1Chat',
  });
  Chat.belongsTo(User, {
    foreignKey: 'userId1',
  });

  User.hasMany(Chat, {
    foreignKey: 'userId2',
    as: 'UserId2Chat',
  });
  Chat.belongsTo(User, {
    foreignKey: 'userId2',
  });

  //console.log(BusinessSpot.associations)
  //console.log(UserDate.associations)

  // ─── SPECIAL WITHDRAWAL ASSOCIATIONS ───────────────────────────────

  // User <-> MerchantSpecialWithdrawalProfile
  User.hasOne(MerchantSpecialWithdrawalProfile, {
    foreignKey: 'merchantId',
    as: 'SpecialWithdrawalProfile',
  });
  MerchantSpecialWithdrawalProfile.belongsTo(User, {
    foreignKey: 'merchantId',
    as: 'Merchant',
  });

  // User <-> MerchantDenominationCharge
  User.hasMany(MerchantDenominationCharge, {
    foreignKey: 'merchantId',
    as: 'DenominationCharges',
  });
  MerchantDenominationCharge.belongsTo(User, {
    foreignKey: 'merchantId',
    as: 'ChargeMerchant',
  });

  // SpecialWithdrawalDenomination <-> MerchantDenominationCharge
  SpecialWithdrawalDenomination.hasMany(MerchantDenominationCharge, {
    foreignKey: 'denominationId',
    as: 'MerchantCharges',
  });
  MerchantDenominationCharge.belongsTo(SpecialWithdrawalDenomination, {
    foreignKey: 'denominationId',
    as: 'Denomination',
  });

  // User (client) <-> SpecialWithdrawalRequest (now Orders)
  User.hasMany(Orders, {
    foreignKey: 'clientId',
    as: 'ClientSpecialWithdrawals',
  });
  Orders.belongsTo(User, {
    foreignKey: 'clientId',
    as: 'Client',
  });

  // User (merchant) <-> SpecialWithdrawalRequest (now Orders)
  User.hasMany(Orders, {
    foreignKey: 'merchantId',
    as: 'MerchantSpecialWithdrawals',
  });
  Orders.belongsTo(User, {
    foreignKey: 'merchantId',
    as: 'RequestMerchant',
  });

  // SpecialWithdrawalDenomination <-> SpecialWithdrawalRequest (now Orders)
  SpecialWithdrawalDenomination.hasMany(Orders, {
    foreignKey: 'denominationId',
    as: 'Requests',
  });
  Orders.belongsTo(SpecialWithdrawalDenomination, {
    foreignKey: 'denominationId',
    as: 'RequestDenomination',
  });

  // Transaction <-> SpecialWithdrawalRequest (now Orders)
  Transaction.hasOne(Orders, {
    foreignKey: 'transactionId',
    as: 'SpecialWithdrawalRequest',
  });
  Orders.belongsTo(Transaction, {
    foreignKey: 'transactionId',
    as: 'RequestTransaction',
  });
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
  Admin,
  Notification,
  NinOtp,
  PinReset,
  SpecialWithdrawalDenomination,
  MerchantSpecialWithdrawalProfile,
  MerchantDenominationCharge,
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
  initAdmin(connection);
  initNotification(connection);
  initNinOtp(connection);
  initPinReset(connection);
  initSpecialWithdrawalDenomination(connection);
  initMerchantSpecialWithdrawalProfile(connection);
  initMerchantDenominationCharge(connection);
  associate();
  authenticateConnection(connection);
}
