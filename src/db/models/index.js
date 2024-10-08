import User, { init as initUser } from "./user.js";
import MerchantProfile, { init as initMerchantProfile } from "./merchantProfile.js";
import Chat, { init as initChat } from "./chat.js";
import EmailandTelValidation, { init as initEmailandTelValidation } from "./emailAndTelValidation.js";
import PasswordReset, { init as initPasswordReset } from "./passwordReset.js";





function associate() {



  User.hasOne(MerchantProfile, {
    foreignKey: 'userId',
    as: "MerchantProfile",
  });
  MerchantProfile.belongsTo(User, {
    foreignKey: 'userId',
  })



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
  User
}

export function init(connection) {
  initUser(connection);
  initChat(connection);
  initEmailandTelValidation(connection)
  initPasswordReset(connection)
  initMerchantProfile(connection)
 
  associate();
  authenticateConnection(connection)
}
