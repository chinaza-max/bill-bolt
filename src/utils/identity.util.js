import Joi from 'joi';

class IdentityUtil {
  registerSchema = Joi.object().keys({
    companyName: Joi.string().trim().required().messages({
      'any.required': 'Company name is required',
    }),
    cacNumber: Joi.string().trim().optional().allow('', null),
    address: Joi.string().trim().required().messages({
      'any.required': 'Address is required',
    }),
    contactName: Joi.string().trim().required().messages({
      'any.required': 'Contact name is required',
    }),
    email: Joi.string().trim().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Valid email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
    }),
    phoneNumber: Joi.string().trim().optional().allow('', null),
  });

  loginSchema = Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  updateWebhookSchema = Joi.object().keys({
    webhookUrl: Joi.string().uri().required().messages({
      'any.required': 'Webhook URL is required',
      'string.uri': 'Valid URL format is required (e.g. https://yourdomain.com/webhook)',
    }),
  });

  fundWalletSchema = Joi.object().keys({
    amount: Joi.number().positive().required().messages({
      'any.required': 'Amount is required',
      'number.positive': 'Amount must be greater than 0',
    }),
  });

  initiateNINSchema = Joi.object().keys({
    number: Joi.string().trim().required().messages({
      'any.required': 'NIN number is required',
    }),
    type: Joi.string().valid('NIN', 'BVN').default('NIN'),
    async: Joi.boolean().default(false),
    // debitAccountNumber is NOT required from client request
  });

  verifyNINSchema = Joi.object().keys({
    identityId: Joi.string().trim().required().messages({
      'any.required': 'Identity ID is required',
    }),
    otp: Joi.string().trim().required().messages({
      'any.required': 'OTP code is required',
    }),
    type: Joi.string().valid('NIN', 'BVN').default('NIN'),
  });

  verifyEmailOtpSchema = Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Valid email is required',
    }),
    otp: Joi.string().trim().length(6).required().messages({
      'any.required': 'OTP is required',
      'string.length': 'OTP must be exactly 6 digits',
    }),
  });

  resendEmailOtpSchema = Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Valid email is required',
    }),
  });
}

export default new IdentityUtil();
