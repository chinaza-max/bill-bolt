import Joi from 'joi';

class authUtil {
  verifyUserCreationData = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    emailAddress: Joi.string().email().required(),
    password: Joi.string().required(),
    tel: Joi.number().integer().required(),
    telCode: Joi.string().required(),
    dateOfBirth: Joi.date().iso().required().messages({
      'date.base': 'Date of birth must be a valid date.',
      'date.format': 'Date of birth must be in the format YYYY-MM-DD.',
      'any.required': 'Date of birth is required.',
    }),
  });

  verifyHandleEnterPassCode = Joi.object({
    emailAddress: Joi.string().required(),
    passCode: Joi.number().required(),
  });

  verifyHandleVerifyEmailorTel = Joi.object({
    emailAddress: Joi.string().required(),
    validateFor: Joi.string().valid('user', 'admin').required(),
    verificationCode: Joi.number().required(),
    type: Joi.string().valid('email', 'tel').required(),
  });

  verifyHandleSendVerificationCodeEmailOrTel = Joi.object({
    emailAddress: Joi.string().required(),
    validateFor: Joi.string().valid('user', 'admin').required(),
    type: Joi.string().required(),
  });

  verifyHandleLoginUser = Joi.object({
    password: Joi.string().required(),
    type: Joi.string().valid('user', 'admin').required(),
    emailAddress: Joi.string().email().required(),
  });

  validateHandleSendPasswordResetLink = Joi.object({
    emailOrPhone: Joi.alternatives()
      .try(Joi.string().email(), Joi.number())
      .required(),
    type: Joi.string().valid('user', 'admin').required(),
  });

  validatePasswordReset = Joi.object().keys({
    password: Joi.string().min(6).required(),
    resetPasswordKey: Joi.string().min(1).required(),
  });

  // utils/auth.util.ts

  validateHandleVerifyPinResetOtp = Joi.object({
    otp: Joi.string().length(6).required(),
    userId: Joi.number().required(),
  });

  validateHandleSendPinResetOtp = Joi.object({
    emailOrPhone: Joi.string().trim().required().messages({
      'string.empty': 'Email or phone is required',
    }),
    type: Joi.string().valid('user', 'admin').required(),
  });

  /*
    verifyHandleUploadPicture= Joi.object({
      userId: Joi.number().required(),
      image: Joi.object({
        size: Joi.number().max(1048576).required(), // Maximum size allowed is 1MB (1048576 bytes)
      }).required(),
    });


    verifyHandleIntializePayment= Joi.object({
      transactionReference: Joi.string().required(),
    });
    
    verifyHandleLoginAdmin= Joi.object({
      password: Joi.string().required(),
      emailOrTel: Joi.alternatives().try(
        Joi.string(),
        Joi.number()
      ),
    });

    verifyHandleUpdateTel= Joi.object({
      userId: Joi.number().required(),
      tel: Joi.number().required(),
    });


  

 

    validateHandleValidateBankAccount= Joi.object().keys({
      bankCode: Joi.string().required(),
      accountNumber: Joi.string().required(),
    });
    


  */
}

export default new authUtil();
