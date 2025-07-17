import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  User,
  PasswordReset,
  EmailandTelValidation,
  Transaction,
  Setting,
  MerchantProfile,
  Admin,
  Orders,
  MerchantAds,
} from '../db/models/index.js';
import serverConfig from '../config/server.js';
import authUtil from '../utils/auth.util.js';
import userService from '../service/user.service.js';
import { Buffer } from 'buffer';
import mailService from '../service/mail.service.js';
import axios from 'axios';
import { loadActiveGateway } from '../utils/gatewayLoader.js';
import crypto from 'crypto';
import { google } from 'googleapis';
import { oAuth2Client } from '../auth/oauthClient.js';
import fs from 'fs';
import {
  ConflictError,
  SystemError,
  UnAuthorizedError,
  NotFoundError,
} from '../errors/index.js';
import { Op } from 'sequelize';
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

class AuthenticationService {
  UserModel = User;
  PasswordResetModel = PasswordReset;
  EmailandTelValidationModel = EmailandTelValidation;
  TransactionModel = Transaction;
  SettingModel = Setting;
  MerchantProfileModel = MerchantProfile;
  AdminModel = Admin;
  OrdersModel = Orders;
  MerchantAdsModel = MerchantAds;
  async loadGateWay(alternativeGateway) {
    const Setting = await this.SettingModel.findByPk(1);
    this.gateway = await loadActiveGateway(
      alternativeGateway || Setting.activeGateway
    );
    this.validFor = Setting.validFor;
    this.callbackUrl = Setting.callbackUrl;
  }
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

  async handleEnterPassCode(data) {
    const { passCode, emailAddress } =
      await authUtil.verifyHandleEnterPassCode.validateAsync(data);

    let userResult = await this.UserModel.findOne({
      where: {
        emailAddress: emailAddress,
        isEmailValid: true,
        isDeleted: false,
      },
      include: [
        {
          model: MerchantProfile,
          as: 'MerchantProfile', // Ensure this matches the alias in associations
          //attributes: ["id", "businessName", "businessType"], // Add required fields
          required: false,
        },
      ],
    });

    if (!userResult) throw new NotFoundError('User not found.');

    let myPassCode = passCode + '';

    if (!userResult.passCode) return null;
    if (!(await bcrypt.compare(myPassCode, userResult.passCode))) return null;

    if (userResult.disableAccount) return 'disabled';

    return userResult;
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

    if (existingUser) throw new ConflictError(existingUser);

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
        where: { emailAddress },
      });
    } else {
      relatedUser = await this.AdminModel.findOne({
        where: { emailAddress },
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
          //isEmailValid: true,
          isDeleted: false,
        },
        include: [
          {
            model: MerchantProfile,
            as: 'MerchantProfile', // Ensure this matches the alias in associations
            //attributes: ["id", "businessName", "businessType"], // Add required fields
            required: false,
          },
        ],
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
    await user.update({
      isOnline: true,
    });
    if (user?.isEmailValid === false) {
      const validateFor = 'user';
      await this.sendEmailVerificationCode(emailAddress, user.id, validateFor);
      return 'unverifiedEmail';
    }
    if (!user?.passCode) {
      user.passCode = false;
    }
    if (!user?.describeYou) {
      user.describeYou = false;
    }
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
            /*isEmailValid: true,*/
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
              ? `${
                  serverConfig.DOMAIN
                }/resetPasswordPage.html?${params.toString()}`
              : `${
                  serverConfig.DOMAIN
                }/resetPasswordPage.html?${params.toString()}`,
        },
      });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleVirtualAccountCollection(data) {
    const settingModelResult = await this.SettingModel.findByPk(1);
    if (!settingModelResult) throw new NotFoundError('No setting found');

    try {
      if (settingModelResult.activeGateway === 'safeHaven.gateway') {
        if (data.type === 'transfer') {
          this.updateTransactionSaveHaven(data);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async updateTransactionSaveHaven(data) {
    const sessionId = data?.data?.sessionId;
    const transactionStatus = data?.data?.status;
    const transactionAmount = data?.data?.amount;
    const transactionType = data?.type;

    if (!sessionId || !transactionStatus || !transactionAmount) return;

    const transaction = await this.TransactionModel.findOne({
      where: { sessionIdVirtualAcct: sessionId },
    });

    if (!transaction) return;

    if (!this.gateway) {
      await this.loadGateWay();
    }

    if (transactionStatus !== 'Completed') return;

    transaction.paymentStatus = 'successful';
    await transaction.save();

    const {
      transactionType: type,
      orderAmount,
      merchantId,
      userId,
      id,
    } = transaction;

    if (type === 'order') {
      if (orderAmount === transactionAmount) {
        await this._handleOrder(transaction, transactionAmount);
      } else {
        await this.updateWallet(transactionAmount, userId);
      }
    } else if (type === 'fundwallet') {
      await this.updateWallet(transactionAmount, userId);
    }
  }

  async _handleOrder(transaction, transactionAmount) {
    const merchant = await this.MerchantAdsModel.findOne({
      where: { UserId: transaction.merchantId },
    });

    const settings = await this.SettingModel.findByPk(1);

    const amountSummary = this.getdeliveryAmountSummary(
      merchant.pricePerThousand,
      transaction.orderAmount,
      settings.serviceCharge,
      settings.gatewayService
    );

    await this.createOrder({
      transactionId: transaction.id,
      userId: transaction.userId,
      merchantId: transaction.merchantId,
      amountOrder: amountSummary.amountOrder,
      totalAmount: amountSummary.totalAmount,
      qrCodeHash: this.generateQrCodeHash(),
    });
  }

  generateQrCodeHash() {
    return crypto.randomBytes(16).toString('hex'); // 32-character hex string
  }

  async updateWallet(amount, userId) {
    console.log(
      `[updateWallet] Called with amount: ${amount}, userId: ${userId}`
    );

    if (!userId || amount <= 0) {
      console.warn(
        `[updateWallet] Invalid input: userId=${userId}, amount=${amount}`
      );
      return;
    }

    const sequelize = this.UserModel.sequelize;

    try {
      const result = await sequelize.transaction(async (t) => {
        console.log(`[updateWallet] Starting transaction for userId=${userId}`);

        const user = await this.UserModel.findByPk(userId, {
          lock: true,
          transaction: t,
        });

        if (!user) {
          console.warn(`[updateWallet] User not found: userId=${userId}`);
          return null;
        }

        console.log(
          `[updateWallet] Fetched user: ${JSON.stringify(user.toJSON())}`
        );

        let balance = { previous: 0, current: 0 };

        try {
          if (typeof user.walletBalance === 'string') {
            balance = JSON.parse(user.walletBalance);
          } else if (typeof user.walletBalance === 'object') {
            balance = user.walletBalance;
          }
        } catch (err) {
          console.error(`[updateWallet] Error parsing walletBalance:`, err);
          balance = { previous: 0, current: 0 };
        }

        const currentBalance = balance.current || 0;
        const newBalance = {
          previous: currentBalance,
          current: currentBalance + amount,
        };

        console.log(
          `[updateWallet] Updating balance: ${JSON.stringify(newBalance)}`
        );

        user.walletBalance = newBalance;

        await user.save({ transaction: t });

        console.log(
          `[updateWallet] User saved with new walletBalance: ${JSON.stringify(
            user.walletBalance
          )}`
        );

        return user;
      });

      console.log(`[updateWallet] Transaction complete for userId=${userId}`);
      return result;
    } catch (err) {
      console.error(`[updateWallet] Error during transaction:`, err);
      throw err; // Let the caller handle or log further
    }
  }

  async handleUploadImageGoogleDrive(file) {
    try {
      const { path: filePath, originalname, mimetype } = file;
      const data = await this.uploadToDrive(filePath, originalname, mimetype);

      return {
        publicLink: data.webContentLink,
        drivePreview: `https://drive.google.com/thumbnail?id=${data.fileId}&sz=w1000`,
      };
    } catch (err) {
      console.error('Upload error:', err);
      new SystemError('Upload failed');
    }
  }

  async uploadToDrive(filePath, fileName, mimeType) {
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    const fileMetadata = {
      name: fileName,
      parents: ['1i13u4Britpr2rvvNGDkVuqKbr6B-LH7e'],
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = file.data.id;

    // Make file public
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const result = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });

    const obj = {
      ...result.data,
      fileId,
    };

    return obj;
  }

  extractFileId(publicUrl) {
    const match =
      publicUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      publicUrl.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  async handleDeleteFromAppfileGoogleDrive(data) {
    const { publicUrl } = data;
    const fileId = this.extractFileId(publicUrl);

    if (!fileId) throw new Error('Invalid or missing fileId from URL');

    try {
      await drive.files.delete({ fileId });
      return 'File deleted successfully from appfile';
    } catch (err) {
      console.error('Unexpected error during delete:', err);

      throw new Error('Failed to delete file from Google Drive');
    }
  }

  async createOrder(transactionId, userId, merchantId) {
    try {
      const merchantProfile = await this.UserModel.findOne({
        where: {
          id: merchantId,
        },
      });
      const user = await this.UserModel.findOne({
        where: {
          id: userId,
        },
      });

      if (!merchantProfile || !user) throw new NotFoundError('No user found');

      const order = await this.OrdersModel.create({
        clientId: userId,
        merchantId: merchantId,
        orderStatus: 'pending',
        moneyStatus: 'received',
      });
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
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
      throw new SystemError(error.name, error.parent);
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
      console.log('error', error);
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
      console.log('error', error);
      return error;
    }
  }

  async handleVerifyEmailorTel(data) {
    let { emailAddress, verificationCode, validateFor, type } =
      await authUtil.verifyHandleVerifyEmailorTel.validateAsync(data);

    const UserModelResult = await this.UserModel.findOne({
      where: { emailAddress },
    });

    if (UserModelResult == null) throw new NotFoundError('No user found');

    let relatedEmailoRTelValidationCode =
      await this.EmailandTelValidationModel.findOne({
        where: {
          userId: UserModelResult.id,
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

        userService.makeMatch();
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
        return 'User with this email already exists. try to login or do a password reset';
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
  async getdeliveryAmountSummary(
    merchantads,
    amount,
    serviceCharge,
    gatewayService
  ) {
    // Sort all arrays by the amount in ascending order
    merchantads.sort((a, b) => a.amount - b.amount);
    serviceCharge.sort((a, b) => a.amount - b.amount);
    gatewayService.sort((a, b) => a.amount - b.amount);

    let closestMerchantAmount = null;
    let closestServiceCharge = null;
    let closestGatewayCharge = null;

    // Find the closest merchant amount that is less than or equal to the provided amount
    for (let i = 0; i < merchantads.length; i++) {
      if (merchantads[i].amount <= amount) {
        closestMerchantAmount = merchantads[i];
      } else {
        break;
      }
    }

    // Find the closest service charge that is less than or equal to the provided amount
    for (let i = 0; i < serviceCharge.length; i++) {
      if (serviceCharge[i].amount <= amount) {
        closestServiceCharge = serviceCharge[i];
      } else {
        break;
      }
    }

    // Find the closest gateway charge that is less than or equal to the provided amount
    for (let i = 0; i < gatewayService.length; i++) {
      if (gatewayService[i].amount <= amount) {
        closestGatewayCharge = gatewayService[i];
      } else {
        break;
      }
    }

    // If valid closest amounts are found, calculate and return the summary
    if (closestMerchantAmount && closestServiceCharge && closestGatewayCharge) {
      const totalAmountToPay =
        amount +
        closestMerchantAmount.charge +
        closestServiceCharge.charge +
        closestGatewayCharge.charge;

      return {
        totalAmount: totalAmountToPay, // Total amount to be paid
        merchantCharge: closestMerchantAmount.charge, // Merchant charge
        serviceCharge: closestServiceCharge.charge, // Service charge
        gatewayCharge: closestGatewayCharge.charge, // Gateway charge
        amountOrder: amount, // Amount to be ordered
      };
    } else {
      throw new Error('No valid charge found for the given amount');
    }
  }
}

export default new AuthenticationService();
