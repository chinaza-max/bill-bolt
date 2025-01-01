import Joi from 'joi';

class UserUtil {
  verifyHandleUpdatePin = Joi.object().keys({
    NIN: Joi.string().required(),
    role: Joi.string().valid('list', 'rent'),
    userId: Joi.number().integer().required(),
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
    about: Joi.string()
      .optional()
      .label('Information about your self and building'),
    country: Joi.string().optional().label('Country'),
    state: Joi.string().optional().label('State'),
    image: Joi.object({
      size: Joi.number().positive().less(3000000).optional(),
    }).optional(),
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
    nin: Joi.string().required().label('Display Name'),
  });
  verifyHandleGetMyMerchant = Joi.object({
    userId: Joi.number().required().label('User ID'),
  });

  verifyHandleCreateMerchantAds = Joi.object({
    userId: Joi.number().integer().required(),
    minAmount: Joi.number().integer().min(0).required(),
    maxAmount: Joi.number().integer().min(Joi.ref('minAmount')).required(),
    pricePerThousand: Joi.object()
      .pattern(Joi.string().required(), Joi.number().min(0).required())
      .required(),
  });
}

export default new UserUtil();
