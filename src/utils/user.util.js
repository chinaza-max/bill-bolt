import Joi from 'joi';
const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

const breakPointSchema = Joi.array().items(
  Joi.object({
    amount: Joi.number().required(),
    prices: Joi.array().items(Joi.number()).required(),
  })
);

class UserUtil {
  verifyHandleUpdatePin = Joi.object().keys({
    NIN: Joi.string().required(),
    role: Joi.string().valid('list', 'rent'),
    userId: Joi.number().integer().required(),
  });

  verifyHandleUpdateMerchantProfile = Joi.object().keys({
    userId: Joi.number().required().label('user Id'),
    displayName: Joi.string().optional().label('Display Name'),
    tel: Joi.number().optional().label('Telephone Number'),
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
    otpCode: Joi.number().required(),
    role: Joi.string(),
    userId: Joi.number().integer().required(),
  });

  verifyHandleSetPin = Joi.object({
    userId: Joi.number().required(),
    passCode: Joi.number().required(),
  });

  verifyHandleUpdateToken = Joi.object({
    userId: Joi.number().required(),
    fcmToken: Joi.string().required(),
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
    type: Joi.string().valid('fundWallet', 'order').required(),
    userId2: Joi.when('type', {
      is: 'order',
      then: Joi.number().integer().required(),
      otherwise: Joi.number().integer().allow(null),
    }),
  });

  verifyHandleGetGeneralTransactionHistory = Joi.object({
    userId: Joi.number().integer().required(),
    limit: Joi.number().integer().optional(),
    offset: Joi.number().integer().optional(),
    startDate: Joi.string()
      .optional()
      .pattern(dateFormat)
      .message('startDate must be in the format YYYY-MM-DD'),
    endDate: Joi.string()
      .optional()
      .pattern(dateFormat)
      .message('endDate must be in the format YYYY-MM-DD'),
  });

  verifyHandleGetMyOrderDetails = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    userType: Joi.string().required().valid('client', 'merchant'),
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
    // orderId: Joi.number().integer().required(),
    // type: Joi.string().required(),
  });
  verifyHandleSubmitComplain = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });
  verifyHandleGetMyAds = Joi.object({
    userId: Joi.number().integer().required(),
  });
  verifyHandleSetMerchantAccountStatus = Joi.object({
    userId: Joi.number().integer().required(),
    markVerification: Joi.string()
      .valid('NinVerified', 'FaceVerified', 'DisplayNameMerchantSet')
      .required(),
  });
  verifyHandleSetWithdrawalBank = Joi.object({
    userId: Joi.number().integer().required(),
    settlementAccount: Joi.string().required(),
    bankCode: Joi.string().required(),
    bankName: Joi.string().required(),
  });

  verifyHandleGetBank = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });

  verifyHandleGetUsers = Joi.object({
    userId: Joi.number().integer().required(),
    type: Joi.string().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  });

  verifyHandleGetUsersData = Joi.object({
    userId: Joi.number().integer().required(),
  });
  verifyHandleNameEnquiry = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
  });

  verifyHandleManageBreakPoint = Joi.object({
    userId: Joi.number().required(),
    breakPoint: Joi.array().items(
      Joi.object({
        amount: Joi.number().required(),
        prices: Joi.array().items(Joi.number()).required(),
      })
    ),
  });

  verifyHandleGetAdmins = Joi.object({
    userId: Joi.number().integer().required(),
    //  type: Joi.string().valid('admin', 'superAdmin').required(),
  });

  verifyHandleGetdefaultAds = Joi.object({
    userId: Joi.number().integer().required(),
  });

  verifyHandleGetMerchantProfile = Joi.object({
    userId: Joi.number().integer().required(),
  });

  verifyHandleSubmitUserMessage = Joi.object({
    userId: Joi.number().integer().required(),
    message: Joi.string().required(),
    title: Joi.string().required(),
    complaintType: Joi.string().required(),
  });

  verifyHandleUpdateComplainStatus = Joi.object({
    userId: Joi.number().integer().required(),
    complaintId: Joi.number().integer().required(),
    status: Joi.string(),
    view: Joi.string(),
  });

  verifyHandleGetChargeSummary = Joi.object({
    userId: Joi.number().integer().required(),
    userId2: Joi.number().integer().required(),
    amount: Joi.number().integer().required(),
  });

  verifyHandleGetMerchantInformation = Joi.object({
    userId: Joi.number().integer().required(),
    userId2: Joi.number().integer().required(),
  });

  verifyHandleMakeOrderPayment = Joi.object({
    userId: Joi.number().integer().required(),
    userId2: Joi.number().integer().required(),
    amount: Joi.number().integer().required(),
    amountOrder: Joi.number().required(),
  });

  verifyHandleUpdateAdmin = Joi.object({
    userId: Joi.number().integer().required(),
    emailAddress: Joi.string().email().required(),
    password: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    privilege: Joi.string().valid('admin', 'superAdmin').required(),
  });

  verifyHandleCreateAdmin = Joi.object({
    userId: Joi.number().integer().required(),
    emailAddress: Joi.string().email().required(),
    password: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    privilege: Joi.string().valid('admin', 'superAdmin').required(),
  });

  verifyHandleUpdateMerchantStatus = Joi.object({
    userId: Joi.number().integer().required(),
    accountStatus: Joi.string()
      .valid('active', 'processing', 'notActive', 'rejected', 'suspended')
      .required(),
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

  verifyHandleGetOrderStatistic = Joi.object({
    userId: Joi.number().integer().required(),
  });

  verifyHandleWhoIAm = Joi.object({
    userId: Joi.number().integer().required(),
  });

  verifyHandleOrderAcceptOrCancel = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    type: Joi.string().required(),
    reason: Joi.string().optional(),
  });

  verifyHandleverifyCompleteOrder = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    hash: Joi.string().required(),
  });

  verifyHandleGetTransactionHistoryOrder = Joi.object({
    userId: Joi.number().integer().required(),
    startDate: Joi.date().optional().label('Start Date').iso(),
    endDate: Joi.date().optional().label('End Date').iso(),
  });
  verifyHandleGetChatHistory = Joi.object({
    userId: Joi.number().integer().required(),
    orderId: Joi.number().integer().required(),
    userType: Joi.string().valid('client', 'merchant').required(),
  });
  verifyHandleGetMyOrders = Joi.object({
    userId: Joi.number().integer().required(),
    type: Joi.string().required().valid('active', 'completed', 'all'),
    userType: Joi.string().valid('client', 'merchant').required(),
  });
  handleverifyCompleteOrder = Joi.object({
    userId: Joi.number().integer().required(),
    type: Joi.string().required(),
    userType: Joi.string().valid('client', 'merchant').required(),
  });
}

export default new UserUtil();
