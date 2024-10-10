import Joi from "joi";

class authUtil {

  verifyUserCreationData= Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    emailAddress: Joi.string().email().required(),
    password: Joi.string().required(),
    tel: Joi.number().integer().required(),
    telCode: Joi.string().required(),   
  });

/*
  verifyHandleVerifyEmailorTel= Joi.object({
    userId: Joi.number().required(),
    validateFor: Joi.string().valid(
      'rent',
      'list',
      'admin'
    ).required(),
    verificationCode: Joi.number().required(),
    type: Joi.string().valid(
      'email',
      'tel'  
    ).required()
  });

    verifyHandleSendVerificationCodeEmailOrTel= Joi.object({
      userId: Joi.number().required(),
      validateFor: Joi.string().valid(
        'rent',
        'list'
      ).required(),
      type: Joi.string().required()
    });
    
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


    verifyHandleLoginUser= Joi.object({
      password: Joi.string().required(),
      type:Joi.string().valid(
        'rent',
        'list',
        'admin',
      ).required(),
      emailAddress: Joi.string().email().required()
    })
    

    validateHandleSendPasswordResetLink  = Joi.object({
      emailOrPhone: Joi.alternatives().try(
        Joi.string().email(), 
        Joi.number(), 
      ).required(),
      type: Joi.string().valid(
        'rent',
        'list',
        'admin'
      ).required(),
    });
 

    validateHandleValidateBankAccount= Joi.object().keys({
      bankCode: Joi.string().required(),
      accountNumber: Joi.string().required(),
    });
    
  validatePasswordReset = Joi.object().keys({
    password: Joi.string().min(6).required(),
    resetPasswordKey: Joi.string().min(1).required(),
  });

  */
}

export default new authUtil();
