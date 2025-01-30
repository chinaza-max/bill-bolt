import Joi from 'joi';
const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
class UserUtil {
  verifyHandleUpdatePin = Joi.object().keys({
    NIN: Joi.string().required(),
    role: Joi.string().valid('list', 'rent'),
    userId: Joi.number().integer().required(),
  });

  verifyHandleUpdateMerchantProfile = Joi.object().keys({
    userId: Joi.number().required().label('user Id'),
    displayname: Joi.string().optional().label('Display Name'),
    passCode: Joi.string().optional().label('Pass Code'),
    accountStatus: Joi.string()
      .optional()
      .valid('active', 'processing', 'notActive', 'rejected')
      .label('Account Status'),
    deliveryRange: Joi.number().optional().label('Delivery Range'),
    notificationAllowed: Joi.boolean().optional().label('Notification Allowed'),
    disableAccount: Joi.boolean().optional().label('Disable Account'),
  });

  verifyHandleUpdateProfile = Joi.object({
    userId: Joi.number().required().label('user Id'),
    role: Joi.string().required().valid('user'),
    describeYou: Joi.string().optional(),
    firstName: Joi.string().optional().label('First Name'),
    lastName: Joi.string().optional().label('Last Name'),
    tel: Joi.number().optional().label('Telephone Number'),
    telCode: Joi.string().optional().label('Telephone Code'),
    lat: Joi.string().optional(),
    lng: Joi.string().optional(),
    deviceType: Joi.string().optional(),
    settlementAccount: Joi.string().optional(),
    bankCode: Joi.string().optional(),
    bankName: Joi.string().optional(),
    deviceIp: Joi.string().optional(),
    about: Joi.string()
      .optional()
      .label('Information about your self and building'),
    country: Joi.string().optional().label('Country'),
    state: Joi.string().optional().label('State'),
    image: Joi.object({
      size: Joi.number().positive().less(3000000).optional(),
    }).optional(),
  });

  validateHandleInitiateNINVerify = Joi.object().keys({
    NIN: Joi.string().required(),
    userId: Joi.number().integer().required(),
  });
  validateHandleValidateNIN = Joi.object().keys({
    NIN: Joi.string().required(),
    role: Joi.string().valid('list', 'rent'),
    userId: Joi.number().integer().required(),
  });

  verifyHandleSetPin = Joi.object({
    userId: Joi.number().required(),
    passCode: Joi.number().required(),
  });

  verifyHandleEnterPassCode = Joi.object({
    userId: Joi.number().required(),
    passCode: Joi.number().required(),
  });

  verifyHandleSignupMerchant = Joi.object({
    userId: Joi.number().required().label('User ID'),
    displayname: Joi.string().required().label('Display Name'),
    nin: Joi.string().required().label('nin'),
    ninName: Joi.string().required(),
  });
  verifyHandleGetMyMerchant = Joi.object({
    userId: Joi.number().required().label('User ID'),
  });

  verifyHandleCreateMerchantAds = Joi.object({
    userId: Joi.number().integer().required(),
    minAmount: Joi.number().integer().min(0).required(),
    maxAmount: Joi.number().integer().min(Joi.ref('minAmount')).required(),
    pricePerThousand: Joi.array()
      .items(
        Joi.object({
          amount: Joi.number().required(), // Adjust the field name to match your JSON object
          charge: Joi.number().min(0).required(), // Adjust the field name to match your JSON object
        })
      )
      .min(1)
      .required(),
  });

  verifyHandleGenerateAccountVirtual = Joi.object({
    userId: Joi.number().integer().required(),
    amount: Joi.number().integer().min(0).required(),
  });
  verifyHandleGetMyOrderDetails = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required().valid('client', 'merchant'),
  });
  verifyHandleSetMerchantAccountStatus = Joi.object({
    userId: Joi.number().integer().required(),
    accountStatus: Joi.string().valid('active', 'notActive').required(),
  });

  verifyHandleGetProfileInformation = Joi.object({
    userId: Joi.number().integer().required(),
  });
  verifyHandleGetMyRangeLimit = Joi.object({
    userId: Joi.number().integer().required(),
  });
  verifyHandleDashBoardStatistic = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleSubmitComplain = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleGetMyAds = Joi.object({
    userId: Joi.number().integer().required(),
  });
  verifyHandleSetWithdrawalBank = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleGetBank = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleGetUsers = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleNameEnquiry = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleGetTransactionHistory = Joi.object({
    userId: Joi.number().integer().required(),
    limit: Joi.number().integer().optional(),
    startDate: Joi.string()
      .optional()
      .pattern(dateFormat)
      .message('startDate must be in the format YYYY-MM-DD'),
    endDate: Joi.string()
      .optional()
      .pattern(dateFormat)
      .message('endDate must be in the format YYYY-MM-DD'),
  });

  verifyHandleGetOrderStatistic = Joi.object({
    userId: Joi.number().integer().required(),
  });
  verifyHandleOrderAcceptOrCancel = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleGetChatHistory = Joi.object({
    userId: Joi.number().integer().required(),
    roomId: Joi.number().integer().required(),
  });
  verifyHandleGetMyOrders = Joi.object({
    userId: Joi.number().integer().required(),
    type: Joi.string().required().valid('active', 'completed'),
    userType: Joi.string().valid('client', 'merchant').required(),
  });
  handleverifyCompleteOrder = Joi.object({
    userId: Joi.number().integer().required(),
    type: Joi.string().required(),
    userType: Joi.string().valid('client', 'merchant').required(),
  });
}

export default new UserUtil();
