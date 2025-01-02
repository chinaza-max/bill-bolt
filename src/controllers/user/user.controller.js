import userService from '../../service/user.service.js';
import authService from '../../service/auth.service.js';
import serverConfig from '../../config/server.js';

export default class UserController {
  async updateProfile(req, res, next) {
    try {
      const data = req.body;
      const { file } = req;

      let my_bj = {
        ...data,
        userId: req.user.id,
        role: req.user.role,
        image: {
          size: file?.size,
        },
      };

      await userService.handleUpdateProfile(my_bj, file);

      return res.status(200).json({
        status: 200,
        message: 'updated successfully',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async updatePin(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
        role: req.user.role,
      };

      await userService.handleUpdatePin(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'updated successfully',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async verifyNIN(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
        role: req.user.role,
      };

      await userService.handleVerifyNIN(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'opt has been sent to the number attached to the nin',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async setPin(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleSetPin(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'login successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async enterPassCode(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const user = await userService.handleEnterPassCode(my_bj);

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

      //let generateTokenFrom={id:user.dataValues.id,role:user.dataValues.emailAddress}
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

      const excludedProperties = ['isDeleted', 'password'];

      const modifiedUser = Object.keys(user.dataValues)
        .filter((key) => !excludedProperties.includes(key))
        .reduce((acc, key) => {
          acc[key] = user.dataValues[key];
          return acc;
        }, {});

      console.log(serverConfig.REFRESH_TOKEN_COOKIE_EXPIRES_IN);
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge:
          serverConfig.REFRESH_TOKEN_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: { accessToken, modifiedUser },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getMyMerchant(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetMyMerchant(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: result,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async signupMerchant(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleSignupMerchant(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async generateAccountVirtual(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleGenerateAccountVirtual(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getChatHistory(req, res, next) {
    try {
      const data = req.params;
      /* 
        use this logic on the front end when
        sending the request for roomId
        const roomId = `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}room`;
      */
      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetChatHistory(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: result,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async createMerchantAds(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleCreateMerchantAds(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async updatefcmToken(req, res, next) {
    const data = req.body;

    try {
      const my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleUpdatefcmToken(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'success',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  /*
  async whoIAm(
    req,
    res,
    next
  ){
   
    try {
    
        const my_bj = {
          userId:req.user.id
        }
                          
        const result=await userService.handleWhoIAm(my_bj);

      return res.status(200).json({
        status: 200,
        data:result,
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }
*/
}
