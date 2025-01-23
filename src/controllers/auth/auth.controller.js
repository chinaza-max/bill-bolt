import authService from '../../service/auth.service.js';
import serverConfig from '../../config/server.js';
import { User } from '../../db/models/index.js';

export default class AuthenticationController {
  constructor() {
    this.UserModel = User;
    //this.filterObject=this.filterObject.bind(this)
    this.signupUser = this.signupUser.bind(this);
    this.verifyEmailorTel = this.verifyEmailorTel.bind(this);
    this.loginUser = this.loginUser.bind(this);
  }
  /*
  async verifyEmailorTelAdmin(req, res, next) {

    try {

      const data = req.body;        

      let my_bj = {
        ...data,
      }
      

      await authService.handleVerifyEmailorTelAdmin(my_bj);


      return res.status(200).json({
        status: 200,
        message: "verification successful",
      });
    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }
  */

  async verifyEmailorTel(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
      };

      const user = await authService.handleVerifyEmailorTel(my_bj);

      let generateTokenFrom = {
        id: user.dataValues.id,
        role: user.dataValues.role,
        emailAddress: user.dataValues.emailAddress,
      };

      const accessToken = await authService.generateAccessToken({
        ...generateTokenFrom,
        scope: 'access',
      });
      const refreshToken = await authService.generateRefreshToken({
        ...generateTokenFrom,
        scope: 'refresh',
      });
          

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge:serverConfig.REFRESH_TOKEN_COOKIE_EXPIRES_IN
      });

      const UserModelResult = await this.UserModel.findByPk(user.dataValues.id);
      await UserModelResult.update({ refreshToken });

      return res.status(200).json({
        status: 200,
        message: 'verification completed',
        data: { accessToken: accessToken },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async signupUser(req, res, next) {
    try {
      const data = req.body;

      const my_bj = {
        ...data,
      };

      const result = await authService.handleUserCreation(my_bj);

      const keysToRemove = ['password'];
      const filteredUser = this.filterObject(result.dataValues, keysToRemove);

      return res.status(200).json({
        status: 200,
        message: 'user registered successfully',
        data: filteredUser,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async loginUser(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
      };

      const user = await authService.handleLoginUser(my_bj);

      if (user == null) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid login credentials',
        });
      } else if (user == 'disabled') {
        return res.status(400).json({
          status: 400,
          message: 'Your account has been disabled',
        });
      }

      let generateTokenFrom = {
        id: user.dataValues.id,
        role: user.dataValues.role,
        emailAddress: user.dataValues.emailAddress,
      };

      const accessToken = await authService.generateAccessToken({
        ...generateTokenFrom,
        scope: 'access',
      });
      const refreshToken = await authService.generateRefreshToken({
        ...generateTokenFrom,
        scope: 'refresh',
      });

      /*
      const excludedProperties = ['isDeleted', 'password'];

      const modifiedUser = Object.keys(user.dataValues)
        .filter(key => !excludedProperties.includes(key))
        .reduce((acc, key) => {
          acc[key] = user.dataValues[key];
          return acc;
        }, {})*/


      const nineMonthsInMilliseconds = 9 * 30 * 24 * 60 * 60 * 1000;
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge:serverConfig.REFRESH_TOKEN_COOKIE_EXPIRES_IN
      });

      const UserModelResult = await this.UserModel.findByPk(user.dataValues.id);
      await UserModelResult.update({ refreshToken });

      return res.status(200).json({
        status: 200,
        message: 'login successfully.',
        data: { accessToken: accessToken },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  /*
  async setPin(req, res, next) {

    try {

      const data = req.body;        

      let my_bj = {
        ...data,
      }
      
      const user=await authService.handleSetPin(my_bj);
    
      if (user == null){
        return res.status(400).json({
          status: 400,
          message: "Invalid login credentials",
        });
      }
      else if(user == "disabled"){
        return res.status(400).json({
          status: 400,
          message: "Your account has been disabled",
        });
      }


      let generateTokenFrom={id:user.dataValues.id,role:user.dataValues.emailAddress}

      const accessToken = await authService.generateAccessToken({...generateTokenFrom, scope: "access" });
      const refreshToken = await authService.generateRefreshToken({...generateTokenFrom, scope: "refresh" });

      /*
      const excludedProperties = ['isDeleted', 'password'];

      const modifiedUser = Object.keys(user.dataValues)
        .filter(key => !excludedProperties.includes(key))
        .reduce((acc, key) => {
          acc[key] = user.dataValues[key];
          return acc;
        }, {})*/
  /*

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true, 
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
        
      return res.status(200).json({
        status: 200,
        message: "login successfully.",
      });


    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }
*/

  async sendPasswordResetLink(req, res, next) {
    try {
      await authService.handleSendPasswordResetLink(req.body);
      return res.status(200).json({
        status: 200,
        message: 'A reset link was sent to your email',
      });
    } catch (error) {
      next(error);
    }
  }

  filterObject(obj, keysToRemove) {
    return Object.keys(obj)
      .filter((key) => !keysToRemove.includes(key))
      .reduce((filteredObj, key) => {
        filteredObj[key] = obj[key];
        return filteredObj;
      }, {});
  }
  /*
  async googleCallback(
    req,
    res,
    next
  ){
    const data=req.body
 
    try {
      
        const my_bj = {
          ...data,
        }
                          
        await authService.handleGoogleCallback(my_bj);

        return res.status(200).json({
          status: 200,
          message: "updated sucessfully",
        });
      
     
    } catch (error) {
      console.log(error)
      next(error);
    }
  }

  async updateTel(
    req,
    res,
    next
  ){
    const data=req.body
 
    try {
      
        const my_bj = {
          ...data,
        }
                          
        await authService.handleUpdateTel(my_bj);

        return res.status(200).json({
          status: 200,
          message: "updated sucessfully",
        });
      
     
    } catch (error) {
      console.log(error)
      next(error);
    }
  }




  




  
  async authorizeTransfer(
    req,
    res,
    next
  ) {
    try {

      
      await authService.authorizeTransfer(req.body);

      return res.status(200).json({
        status: 200,
        message: "web hook received successufully"
      })
    } catch (error) {
      next(error);
    }
  }

    
  async webHookMonifyDisbursement(
    req,
    res,
    next
  ) {
    try {

      await authService.handleWebHookMonifyDisbursement(req.body);

      return res.status(200).json({
        status: 200,
        message: "web hook received successufully"
      })
    } catch (error) {
      next(error);
    }
  }


  async webHookMonifyRefund(
    req,
    res,
    next
  ) {
    try {

      await authService.handleWebHookMonifyRefund(req.body);

      return res.status(200).json({
        status: 200,
        message: "web hook received successufully"
      })
    } catch (error) {
      next(error);
    }
  }




  async webHookCollectionMonify(
    req,
    res,
    next
  ) {
    try {

      await authService.handleWebHookCollectionMonify(req.body);

      return res.status(200).json({
        status: 200,
        message: "web hook received successufull"
      })
    } catch (error) {
      next(error);
    }
  }
*/

  /*
  async intializePayment(
    req,
    res,
    next
  ) {
    try {

      let my_bj = {
        ...data,
        userId:req.user.id
      }


      const response=await authService.handleIntializePayment(my_bj);


      return res.status(200).json({
        status: 200,
        message: "successufull",
        data: response
      });
    } catch (error) {
      next(error);
    }
  }*/

  async pingme(req, res, next) {
    try {
      return res.status(200).json({
        status: 200,
        message: 'successufully ping',
      });
    } catch (error) {
      next(error);
    }
  }
  /*
  async validateBankAccount(
    req,
    res,
    next
  ) {
    try {


      const data = req.body;        

      let my_bj = {
        ...data,
      }
      
      const result=await authService.handleValidateBankAccount(my_bj);

      return res.status(200).json({
        status: 200,
        message: "successufull",
        data:result
      });

    } catch (error) {
      next(error);
    }
  }

  */
  async sendVerificationCodeEmailOrTel(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
      };

      await authService.handleSendVerificationCodeEmailOrTel(my_bj);

      if (data.type == 'email') {
        return res.status(200).json({
          status: 200,
          message: 'verification code sent to your email address',
        });
      } else {
        return res.status(200).json({
          status: 200,
          message: 'verification code sent to your number',
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async virtualAccountCollection(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
      };
      await authService.handleVirtualAccountCollection(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully',
      });
    } catch (error) {
      next(error);
    }
  }
  async refreshAccessToken(req, res, next) {
    try {
      const result = await authService.handleRefreshAccessToken(req);

      if (result == 'Refresh token missing') {
        res.status(401).json({
          status: 401,
          message: "'Refresh token missing'",
        });
      } else if (result == 'Invalid token type for refreshing') {
        res.status(401).json({
          status: 401,
          message: 'Refresh token missing',
        });
      } else if (result == 'contact support user does not exist') {
        res.status(401).json({
          status: 404,
          message: 'contact support user does not exist',
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'successfully',
        data: { accessToken: result },
      });
    } catch (error) {
      next(error);
    }
  }
  async resetPassword(req, res, next) {
    try {
      await authService.handleResetPassword(req.body);

      return res.status(200).json({
        status: 200,
        message: 'Password updated successufully',
      });
    } catch (error) {
      next(error);
    }
  }

  /*
  async sendVerificationCodeEmailOrTel(req, res, next) {

    try {  

      const data = req.body;        

      let my_bj = {
        ...data,
      }

      const obj = await authService.handleSendVerificationCodeEmailOrTel(my_bj);
  

      if(data.type=='email'){
        return res.status(200).json({
          status: 200,
          message: "verification code sent you email address",
        });
      }
      else{
        return res.status(200).json({
          status: 200,
          message: "verification code sent you number",
        });
      }
     
    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }
*/
  /*
  async uploadPicture(req, res, next) {

    try {
      
      const data = req.body;        
      const { file } = req;
      
      let my_bj = {
        ...data,
        image:{
          size:file?.size
        }
      }


    const user=await authService.handleUploadPicture(my_bj,file);


      const token = await authService.generateAccessToken(user.dataValues);

      const excludedProperties = ['isDeleted', 'password'];

      const modifiedUser = Object.keys(user.dataValues)
        .filter(key => !excludedProperties.includes(key))
        .reduce((acc, key) => {
          acc[key] = user.dataValues[key];
          return acc;
        }, {});

    return res.status(200).json({
      status: 200,
      message: "verification successful.",
      data: { user: modifiedUser, token },
    });
     
    } catch (error) {
      console.log(error);
      next(error)
    }
    
  }
*/
  /*
  validateMonnifyIP = (req, res, next) => {
    const clientIP = req.ip;
    if (clientIP !== serverConfig.MONNIFY_IP) {
      return res.status(403).send('Unauthorized IP');
    }
    next();
  };

  validateTransactionHash = (req, res, next) => {
    const monnifySignature = req.headers['monnify-signature'];
    const payload = JSON.stringify(req.body);
    const computedHash = crypto
      .createHmac('sha512', serverConfig.CLIENT_SECRET_MONIFY)
      .update(payload)
      .digest('hex');
  
    if (computedHash !== monnifySignature) {
      return res.status(400).send('Invalid signature');
    }
    next();
  };
*/
}

/*this.sendEmailVerificationCode
      this.sendEmailVerificationCode(obj.emailAddress,obj.id)

async  sendEmailVerificationCode(emailAddress, userId) {

    var keyExpirationMillisecondsFromEpoch = new Date().getTime() + 30 * 60 * 1000;
    const validationCode  = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    console.log(keyExpirationMillisecondsFromEpoch)
    console.log(validationCode)


    await this.PasswordResetModel.findOrCreate({
      where: {
        userId
      },
      defaults: {
        userId,
        type: 'email',
        validationCode,
        expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
      },
    });

    try {
          
        await mailService.sendMail({
          to: emailAddress,
          subject: "Account Verification",
          templateName: "emailVerificationCode",
          variables: {
            verificationCode:verificationCode,
            email: emailAddress,
          },
        });

    } catch (error) {
        console.log(error)
    }



  }
      */
