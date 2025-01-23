import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  User,
  PasswordReset,
  EmailandTelValidation,
  Transaction,
} from '../db/models/index.js';
import serverConfig from '../config/server.js';
import authUtil from '../utils/auth.util.js';
import userService from '../service/user.service.js';
import { Buffer } from 'buffer';
import mailService from '../service/mail.service.js';
import axios from 'axios';

import {
  ConflictError,
  SystemError,
  UnAuthorizedError,
  NotFoundError,
} from '../errors/index.js';
import { Op } from 'sequelize';

class AuthenticationService {
  UserModel = User;
  PasswordResetModel = PasswordReset;
  EmailandTelValidationModel = EmailandTelValidation;
  TransactionModel = Transaction;
  verifyAccessToken(token) {
    try {
      const payload = jwt.verify(token, serverConfig.ACCESS_TOKEN_SECRET);
      return {
        payload,
        expired: false,
      };
    } catch (error) {
      return {
        payload: null,
        expired: error.message.includes('expired') ? error.message : error,
      };
    }
  }

  verifyRefreshToken(token) {
    try {
      const payload = jwt.verify(token, serverConfig.REFRESH_TOKEN_SECRET);
      return {
        payload,
        expired: false,
      };
    } catch (error) {
      return {
        payload: null,
        expired: error.message.includes('expired') ? error.message : error,
      };
    }
  }

  async handleUserCreation(data) {
    let {
      firstName,
      lastName,
      emailAddress,
      password,
      tel,
      telCode,
      dateOfBirth,
    } = await authUtil.verifyUserCreationData.validateAsync(data);

    let hashedPassword;

    try {
      hashedPassword = await bcrypt.hash(
        password,
        Number(serverConfig.SALT_ROUNDS)
      );
    } catch (error) {
      console.log(error);
      throw new SystemError(error);
    }

    let existingUser = await this.isUserEmailExisting(
      emailAddress,
      this.UserModel
    );

    if (existingUser != null) throw new ConflictError(existingUser);

    try {
      const user = await this.UserModel.create({
        firstName,
        lastName,
        emailAddress,
        password: hashedPassword,
        tel,
        telCode,
        dateOfBirth,
      });

      const validateFor = 'user';
      await this.sendEmailVerificationCode(
        user.emailAddress,
        user.id,
        validateFor
      );

      return user;
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleSendVerificationCodeEmailOrTel(data) {
    let { emailAddress, type, validateFor } =
      await authUtil.verifyHandleSendVerificationCodeEmailOrTel.validateAsync(
        data
      );

    let relatedUser;

    if (validateFor == 'user') {
      relatedUser = await this.UserModel.findOne({
        where: { emailAddress},
      });
    } else {
      relatedUser = await this.AdminModel.findOne({
        where: {emailAddress },
      });
    }

    if (!relatedUser) throw new NotFoundError('No user found');
    if (type === 'email') {
      await this.sendEmailVerificationCode(
        relatedUser.emailAddress,
        relatedUser.id,
        validateFor
      );
    } else {
      // await this.sendTelVerificationCode(relatedUser.tel,relatedUser.id)
    }
  }

  async handleLoginUser(data) {
    const { emailAddress, password, type } =
      await authUtil.verifyHandleLoginUser.validateAsync(data);

    let user;

    if (type == 'user') {
      user = await this.UserModel.findOne({
        where: {
          emailAddress,
          isEmailValid: true,
          isDeleted: false,
        },
      });
    } else {
      user = await this.AdminModel.findOne({
        where: {
          emailAddress,
          isEmailValid: true,
          isDeleted: false,
        },
      });
    }

    if (!user) throw new NotFoundError('User not found.');

    if (!(await bcrypt.compare(password, user.password))) return null;

    if (user.disableAccount) return 'disabled';

    return user;
  }

  async handleSendPasswordResetLink(data) {
    const { emailOrPhone, type } =
      await authUtil.validateHandleSendPasswordResetLink.validateAsync(data);

    let matchedUser;

    if (type === 'user') {
      try {
        matchedUser = await this.UserModel.findOne({
          where: {
            [Op.or]: [{ emailAddress: emailOrPhone }, { tel: emailOrPhone }],
            isEmailValid: true,
            disableAccount: false,
            isDeleted: false,
          },
        });
      } catch (error) {
        console.log(error);
        throw new SystemError(error.name, error.parent);
      }
    } else {
      try {
      } catch (error) {
        console.log(error);
        throw new SystemError(error.name, error.parent);
      }
    }

    if (matchedUser == null) {
      throw new NotFoundError('This email does not correspond to any user');
    }

    try {
      var keyExpirationMillisecondsFromEpoch =
        new Date().getTime() + 30 * 60 * 1000;
      var generatedKey = this.generatePassword(true);

      let uniqueId = matchedUser.id + '_' + type;
      var relatedPasswordReset = await this.PasswordResetModel.findOrCreate({
        where: {
          userId: uniqueId,
        },
        defaults: {
          userId: uniqueId,
          resetKey: generatedKey,
          expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
        },
      });

      relatedPasswordReset[0]?.update({
        resetKey: generatedKey,
        expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
      });

      const params = new URLSearchParams();
      params.append('key', generatedKey);
      params.append('Exkey', keyExpirationMillisecondsFromEpoch);

      await mailService.sendMail({
        to: matchedUser.emailAddress,
        subject: 'Reset Password',
        templateName: 'reset_password',
        variables: {
          resetLink:
            serverConfig.NODE_ENV === 'development'
              ? `http://localhost/BillBolt/billBoltServer/resetPasswordfile/sendPasswordLink.html?${params.toString()}`
              : `${
                  serverConfig.DOMAIN
                }/adminpanel/Passwor?${params.toString()}`,
        },
      });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleVirtualAccountCollection(data) {
    try {
      if (data.type === 'virtualAccount.transfer') {
        /*const TransactionModelResult = await this.TransactionModel.findByPk(
          data.data._id
        ); 
        TransactionModelResult.update({});*/
        userService.updateTransaction(data.sessionId);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async handleRefreshAccessToken(req) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) return 'Refresh token missing';

      const { payload, expired } = this.verifyRefreshToken(refreshToken);
      if (expired) throw new UnAuthorizedError('Invalid token.');

      const UserModelResult = await this.UserModel.findByPk(payload.id);

      if (
        UserModelResult?.refreshToken &&
        UserModelResult?.refreshToken !== 'false'
      ) {
        if (payload.scope !== 'refresh') {
          return 'Invalid token type for refreshing';
        } else {
          let generateTokenFrom = {
            id: payload.id,
            role: payload.role,
            emailAddress: payload.emailAddress,
          };

          const newAccessToken = await this.generateAccessToken({
            ...generateTokenFrom,
            scope: 'access',
          });

          return newAccessToken;
        }
      } else {
        return 'contact support user does not';
      }
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name ,error.parent);
    }
  }

  async handleResetPassword(data) {
    var { password, resetPasswordKey } =
      await authUtil.validatePasswordReset.validateAsync(data);

    var relatedPasswordReset = await this.PasswordResetModel.findOne({
      where: {
        resetKey: resetPasswordKey,
      },
    });

    if (relatedPasswordReset == null)
      throw new NotFoundError('Invalid reset link');
    else if (relatedPasswordReset.expiresIn.getTime() < new Date().getTime())
      throw new NotFoundError('Reset link expired');

    const parts = relatedPasswordReset.userId.split('_');
    let relatedUser = null;
    let type = parts[1];
    let userId = parts[0];

    if (type == 'user') {
      relatedUser = await this.UserModel.findOne({
        where: { id: userId },
      });
    } else {
      /* relatedUser = await this.ProspectiveTenantModel.findOne({
          where: { id: userId },
        });*/
    }

    if (relatedUser == null)
      throw new NotFoundError('Selected user cannot be found');
    try {
      var hashedPassword = await bcrypt.hash(
        password,
        Number(serverConfig.SALT_ROUNDS)
      );

      relatedUser.update({
        password: hashedPassword,
      });
      relatedPasswordReset.update({
        expiresIn: new Date(),
      });
    } catch (error) {
      throw new ServerError('Failed to update password');
    }
  }

  async getAuthTokenMonify() {
    try {
      const apiKey = serverConfig.MONNIFY_API_KEY;
      const clientSecret = serverConfig.MONNIFY_CLIENT_SECRET;
      const authHeader = `Basic ${Buffer.from(
        `${apiKey}:${clientSecret}`
      ).toString('base64')}`;

      const response = await axios.post(
        `${serverConfig.MONNIFY_BASE_URL}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.responseBody.accessToken;
    } catch (error) {
      console.error('Error fetching auth token:', error);
      throw error;
    }
  }

  generatePassword(omitSpecial = false, passwordLength = 12) {
    var chars = omitSpecial
      ? '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      : '0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // var passwordLength = 12;
    var password = '';
    for (var i = 0; i <= passwordLength; i++) {
      var randomNumber = Math.floor(Math.random() * chars.length);
      password += chars.substring(randomNumber, randomNumber + 1);
    }
    return password;
  }

  async generateAccessToken(user) {
    try {
      const token = jwt.sign(user, serverConfig.ACCESS_TOKEN_SECRET, {
        algorithm: 'HS256',
        expiresIn: serverConfig.ACCESS_TOKEN_EXPIRES_IN,
        issuer: serverConfig.TOKEN_ISSUER,
      });

      return token;
    } catch (error) {
      console.log("error",error);
      return error;
    }
  }

  async generateRefreshToken(user) {
    try {
      const token = jwt.sign(user, serverConfig.REFRESH_TOKEN_SECRET, {
        algorithm: 'HS256',
        expiresIn: serverConfig.REFRESH_TOKEN_EXPIRES_IN,
        issuer: serverConfig.TOKEN_ISSUER,
      });

      return token;
    } catch (error) {
      console.log("error",error);
      return error;
    }
  }

  async handleVerifyEmailorTel(data) {
    let { emailAddress, verificationCode, validateFor, type } =
      await authUtil.verifyHandleVerifyEmailorTel.validateAsync(data);


    const  UserModelResult = await this.UserModel.findOne({
        where: { emailAddress},
      });

    if(UserModelResult == null) throw new NotFoundError('No user found');

    let relatedEmailoRTelValidationCode =
      await this.EmailandTelValidationModel.findOne({
        where: {
          userId:UserModelResult.id,
          validateFor,
          verificationCode: verificationCode,
          type,
        },
      });

    if (relatedEmailoRTelValidationCode == null) {
      throw new NotFoundError('Invalid verification code');
    } else if (
      relatedEmailoRTelValidationCode.expiresIn.getTime() < new Date().getTime()
    ) {
      throw new NotFoundError('verification code expired');
    }

    let relatedUser;

    if (validateFor == 'user') {
      relatedUser = await this.UserModel.findOne({
        where: { id: relatedEmailoRTelValidationCode.userId },
      });
    }

    if (relatedUser == null) {
      throw new NotFoundError('Selected user cannot be found');
    }

    try {
      if (type === 'email') {
        relatedUser.update({
          isEmailValid: true,
        });

        relatedEmailoRTelValidationCode.update({
          expiresIn: new Date(),
        });

        return relatedUser;
      } else {
        relatedUser.update({
          isTelValid: true,
        });

        return relatedUser;
      }
    } catch (error) {
      throw new ServerError('Failed to update ' + type);
    }
  }

  async isUserEmailExisting(emailAddress, Model) {
    try {
      const existingUser = await Model.findOne({
        where: {
          emailAddress: emailAddress,
          isDeleted: false,
        },
      });

      if (existingUser) {
        return 'User with this email already exists.';
      }
      return null;
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async sendEmailVerificationCode(emailAddress, userId, validateFor) {
    try {
      var keyExpirationMillisecondsFromEpoch =
        new Date().getTime() + 30 * 60 * 1000;
      const verificationCode = Math.floor(Math.random() * 900000) + 100000;

      await this.EmailandTelValidationModel.upsert(
        {
          userId,
          type: 'email',
          validateFor,
          verificationCode,
          expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
        },
        {
          where: {
            userId,
            validateFor,
          },
        }
      );

      try {
        await mailService.sendMail({
          to: emailAddress,
          subject: 'Account Verification',
          templateName: 'emailVerificationCode',
          variables: {
            verificationCode: verificationCode,
            email: emailAddress,
          },
        });
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default new AuthenticationService();
