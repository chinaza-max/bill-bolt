import Joi from "joi";

class UserUtil {




  verifyHandleUpdatePin= Joi.object().keys({
    NIN: Joi.string().required(),
    role: Joi.string().valid('list', 'rent'),
    userId: Joi.number().integer().required()
  });

  verifyHandleUpdateProfileList=Joi.object({
    userId: Joi.number().required().label('user Id'),
    role: Joi.string().required().valid(
      'rent',
      'list'
    ),
    firstName: Joi.string().required().label('First Name'),
    lastName: Joi.string().required().label('Last Name'),
    tel: Joi.number().required().label('Telephone Number'),
    telCode: Joi.string().required().label('Telephone Code'),
    lasrraId: Joi.string().required().label('LASRRA ID'),
    nin: Joi.string().label('NIN'),
    about: Joi.string().required().label('Information about your self and building'),
    country: Joi.string().required().label('Country'),
    state: Joi.string().required().label('State'),
    lga: Joi.string().required().label('LGA'),
    image: Joi.object({
      size: Joi.number().positive().less(3000000).optional(),
    }).optional(),
    type: Joi.string().valid('landLord', 'agent', 'unset').required().label('Type'),
    agentBankCode: Joi.string().when('type', {
      is: 'agent',
      then:Joi.required().label('Agent Bank Code') ,
      otherwise:  Joi.forbidden(),
    }),
    agentBankAccount: Joi.string().when('type', {
      is: 'agent',
      then:Joi.required().label('Agent Bank Account'),
      otherwise: Joi.forbidden(), 
    }),
    landlordBankCode: Joi.string().required().label('Landlord Bank Code'),
    landlordBankAccount:Joi.string().required().label('Landlord Bank Account'),
    companyName: Joi.string().required().label('Company Name'),
    agentRegistrationNO: Joi.string().required().label('Agent Registration Number'),
  });

  
  validateHandleValidateNIN= Joi.object().keys({
    NIN: Joi.string().required(),
    role: Joi.string().valid('list', 'rent'),
    userId: Joi.number().integer().required()
  });

}

export default new UserUtil();





