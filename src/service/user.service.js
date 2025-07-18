import {
  User,
  EmailandTelValidation,
  Setting,
  Mymatch,
  MerchantProfile,
  MerchantAds,
  Orders,
  Chat,
  Transaction,
  Complaint,
  NinOtp,
  Admin,
} from '../db/models/index.js';
import db from '../db/index.js';
import userUtil from '../utils/user.util.js';
import authService from '../service/auth.service.js';
import bcrypt from 'bcrypt';
import serverConfig from '../config/server.js';
import { json, Op, Sequelize, where } from 'sequelize';
import mailService from '../service/mail.service.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, format } from 'date-fns';
import { fn, col, literal } from 'sequelize';
import axios from 'axios';
import { loadActiveGateway } from '../utils/gatewayLoader.js';
import { getSocketInstance } from '../utils/socketUtils.js';
import NotificationService from '../service/push.service.js';
import fs from 'fs';
import path from 'path';
import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';
import { oAuth2Client } from '../auth/oauthClient.js';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const getNanoid = (length) => customAlphabet(ALPHABET, length);

import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  SystemError,
} from '../errors/index.js';
//import { setTimeout } from 'timers/promises';

class UserService extends NotificationService {
  EmailandTelValidationModel = EmailandTelValidation;
  UserModel = User;
  SettingModel = Setting;
  MerchantProfileModel = MerchantProfile;
  MymatchModel = Mymatch;
  MerchantAdsModel = MerchantAds;
  ChatModel = Chat;
  TransactionModel = Transaction;
  OrdersModel = Orders;
  ComplaintModel = Complaint;
  NinOtpModel = NinOtp;
  AdminModel = Admin;

  constructor() {
    super();
    this.gateway;
    this.validFor;
    this.callbackUrl;

    // this.getRouteSummary(-74.044502, 40.689247, -73.98513, 40.758896);
  }
  async loadGateWay(alternativeGateway) {
    const Setting = await this.SettingModel.findByPk(1);
    this.gateway = await loadActiveGateway(
      alternativeGateway || Setting.activeGateway
    );
    this.validFor = Setting.validFor;
    this.callbackUrl = Setting.callbackUrl;
  }
  async handleUpdatePin(data, file) {
    let { userId, role, image, ...updateData } =
      await userUtil.verifyHandleUpdatePin.validateAsync(data);
    try {
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateMerchantProfile(data, file) {
    let { userId, role, ...updateData } =
      await userUtil.verifyHandleUpdateMerchantProfile.validateAsync(data);
    const userModelResult = await this.UserModel.findByPk(userId);

    if (updateData.displayName) {
      updateData.displayName = updateData.displayName
        .toLowerCase()
        .replace(/(?:^\w|\s\w)/g, (match) => match.toUpperCase());
    }
    try {
      let imageUrl = '';
      if (file) {
        if (serverConfig.NODE_ENV == 'production') {
          imageUrl = serverConfig.DOMAIN + file.path.replace('/home', '');
        } else if (serverConfig.NODE_ENV == 'development') {
          imageUrl = serverConfig.DOMAIN + file.path.replace('public', '');
        }
      }

      const MerchantProfileModelResult =
        await this.MerchantProfileModel.findOne({
          where: { userId: userId },
        });

      if (!MerchantProfileModelResult) {
        await this.MerchantProfileModel.create({
          userId: userId,
          accountTier: 1,
          ...updateData,
        });
      } else {
        if (file) {
          await MerchantProfileModelResult.update({ updateData, imageUrl });
          userModelResult.update({ isFaceVerified: true });
        } else {
          await MerchantProfileModelResult.update(updateData);
        }
      }

      if (updateData.displayName) {
        userModelResult.update({ isDisplayNameMerchantSet: true });
      }

      if (updateData.accountStatus) {
        console.log('updateData', updateData.accountStatus);
        await MerchantProfileModelResult.update({
          accountStatus: updateData.accountStatus,
        });
      }

      if (updateData.deliveryRange) {
        await MerchantProfileModelResult.update({
          deliveryRange: updateData.deliveryRange,
        });
      }
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateProfile(data, file) {
    let { userId, role, image, ...updateData } =
      await userUtil.verifyHandleUpdateProfile.validateAsync(data);

    try {
      let imageUrl = '';
      if (file) {
        if (serverConfig.NODE_ENV == 'production') {
          imageUrl = serverConfig.DOMAIN + file.path.replace('/home', '');
        } else if (serverConfig.NODE_ENV == 'development') {
          imageUrl = serverConfig.DOMAIN + file.path.replace('public', '');
        }
      }

      const UserModelResult = await this.UserModel.findByPk(userId);

      if (file) {
        await UserModelResult.update(
          { image: imageUrl, ...updateData }
          //{ where: { id: userId } }
        );
      } else {
        await UserModelResult.update(updateData /*{ where: { id: userId } }*/);
      }
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUploadImageGoogleDrive(data, file) {
    try {
      const { path: filePath, originalname, mimetype } = file;
      const data = await this.uploadToDrive(filePath, originalname, mimetype);

      res.send({
        message: 'File uploaded successfully!',
        publicLink: data.webContentLink,
        drivePreview: data.webViewLink,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).send('Upload failed');
    }
  }

  async uploadToDrive(filePath, fileName, mimeType) {
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    const fileMetadata = {
      name: fileName,
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

    return result.data;
  }

  async handleInitiateNINVerify(data) {
    var { NIN, userId } =
      await userUtil.validateHandleInitiateNINVerify.validateAsync(data);

    /*
    const accessToken = await authService.getAuthTokenMonify();
    const body = {
      nin: NIN,
    };*/

    const userResult = await this.UserModel.findByPk(userId);

    if (!userResult) {
      throw new NotFoundError('User not found');
    }

    if (userResult.nin == NIN && userResult.isNinVerified === true) {
      throw new ConflictError('NIN cannot be verified twice');
    }
    try {
      //check if nin is already verified by another user or your self

      userResult.update({ nin: NIN });

      const ninOtp = await this.NinOtpModel.findOne({
        where: { userId: userId, type: 'NIN' },
      });
      if (!ninOtp) {
        await this.NinOtpModel.create({
          userId: userId,
          type: 'NIN',
          verificationCode: 1234,
          expiresIn: new Date(),
          validateFor: 'user',
        });
      } else {
        await this.NinOtpModel.update(
          { verificationCode: 1234, expiresIn: new Date() },
          { where: { userId: userId, type: 'NIN' } }
        );
      }

      /*
      const response = await axios.post(
        `${serverConfig.MONNIFY_BASE_URL}/api/v1/vas/nin-details`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );*/
      // const phone = response.data.responseBody.mobileNumber;
      // authService.sendNINVerificationCode(phone, userId, role)
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error?.response?.data?.error);
    }
  }

  async handleVerifyNIN(data) {
    var { otpCode, userId } =
      await userUtil.validateHandleValidateNIN.validateAsync(data);

    /*
    const accessToken = await authService.getAuthTokenMonify();
    const body = {
      nin: NIN,
    };*/

    const ninOtp = await this.NinOtpModel.findOne({
      where: { userId: userId, type: 'NIN', verificationCode: otpCode },
    });
    if (ninOtp) {
      const user = await this.UserModel.findByPk(userId);
      await user.update({ isNinVerified: true });
    } else {
      throw new ConflictError('Invalid OTP');
    }
    try {
      //check if nin is already verified by another user or your self
      /*
      const response = await axios.post(
        `${serverConfig.MONNIFY_BASE_URL}/api/v1/vas/nin-details`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );*/
      // const phone = response.data.responseBody.mobileNumber;
      // authService.sendNINVerificationCode(phone, userId, role)
    } catch (error) {
      console.log(error?.response?.data);
      throw new SystemError(error.name, error?.response?.data?.error);
    }
  }

  async handleUpdateComplainStatus(data) {
    const { complaintId, status, view } =
      await userUtil.verifyHandleUpdateComplainStatus.validateAsync(data);

    try {
      const complaintResult = await this.ComplaintModel.findByPk(complaintId);
      if (!complaintResult) throw new NotFoundError('Complaint not found');

      const updates = {};
      if (status) updates.status = status;
      if (view) updates.view = view;

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('Nothing to update. Provide status or view.');
      }

      await complaintResult.update(updates);
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error?.parent || error?.message);
    }
  }

  async handleGetComplain() {
    try {
      const complaintResult = await this.ComplaintModel.findAll({
        where: { isDeleted: false },
        include: [
          {
            model: this.UserModel,
            as: 'ComplaintUser',
            attributes: [
              'firstName',
              'lastName',
              'imageUrl',
              'emailAddress',
              'tel',
            ],
          },
        ],
      });
      return complaintResult;
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleSubmitUserMessage(data) {
    const { userId, title, message, complaintType } =
      await userUtil.verifyHandleSubmitUserMessage.validateAsync(data);

    try {
      await this.ComplaintModel.create({
        userId: userId,
        complaintReason: message,
        title: title,
        complaintType,
      });
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateToken(data) {
    const { fcmToken, userId } =
      await userUtil.verifyHandleUpdateToken.validateAsync(data);

    let userResult = await this.UserModel.findByPk(userId);
    if (!userResult) throw new NotFoundError('User not found.');

    try {
      userResult.update({ fcmToken });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleSetPin(data) {
    const { passCode, userId } =
      await userUtil.verifyHandleSetPin.validateAsync(data);

    let userResult = await this.UserModel.findOne({
      where: {
        id: userId,
        isEmailValid: true,
        isDeleted: false,
      },
    });

    let myPassCode = passCode + '';

    let hashedPassCode;

    try {
      hashedPassCode = await bcrypt.hash(
        myPassCode,
        Number(serverConfig.SALT_ROUNDS)
      );
    } catch (error) {
      console.log(error);
      throw new SystemError(error);
    }
    userResult.update({ passCode: hashedPassCode });
  }

  async handleEnterPassCode(data) {
    const { passCode, userId } =
      await userUtil.verifyHandleEnterPassCode.validateAsync(data);

    let userResult = await this.UserModel.findOne({
      where: {
        id: userId,
        isEmailValid: true,
        isDeleted: false,
      },
    });

    if (!userResult) throw new NotFoundError('User not found.');

    let myPassCode = passCode + '';

    if (!userResult.passCode) return null;
    if (!(await bcrypt.compare(myPassCode, userResult.passCode))) return null;

    if (userResult.disableAccount) return 'disabled';

    return userResult;
  }

  async handleGetMyMerchant(data) {
    const { userId, distance, range } =
      await userUtil.verifyHandleGetMyMerchant.validateAsync(data);

    //  const SettingModelResult = await this.SettingModel.findByPk(1);

    try {
      const MymatchModel = await this.MymatchModel.findOne({
        where: {
          userId,
        },
      });

      if (MymatchModel) {
        let matches = MymatchModel.matches;

        if (typeof matches === 'string') {
          matches = JSON.parse(matches);
        }

        const filteredMatches = [];

        for (let i = 0; i < matches.length; i++) {
          const numberActiveOrder = await this.howmanyActiveOrder(
            matches[i].merchantId
          );
          //if (numberActiveOrder > SettingModelResult.maxOrderPerMerchant)
          // continue;
          let merchant = await this.UserModel.findOne({
            where: { id: matches[i].merchantId, disableAccount: false },
            include: [
              {
                model: MerchantProfile,
                as: 'MerchantProfile',
                attributes: ['displayname', 'deliveryRange', 'imageUrl'],
                where: {
                  accountStatus: 'active',
                },
              },
              {
                model: this.MerchantAdsModel,
                as: 'UserMerchantAds',
                attributes: ['minAmount', 'maxAmount', 'pricePerThousand'],
                required: true,
              },
            ],
            attributes: ['imageUrl', 'isOnline', 'id', 'firstName', 'lastName'],
          });

          let OrdersModelResult = await this.OrdersModel.count({
            where: {
              isDeleted: false,
              merchantId: userId,
              hasIssues: false,
            },
          });

          const isWithinDistance = distance
            ? matches[i].distance <= distance
            : true;

          const isWithinRange = range
            ? merchant.MerchantProfile.some((pr) => pr.deliveryRange <= range)
            : true;

          if (typeof merchant.UserMerchantAds.pricePerThousand === 'string') {
            try {
              merchant.UserMerchantAds.pricePerThousand = JSON.parse(
                merchant.UserMerchantAds.pricePerThousand
              );
            } catch (error) {
              console.error('Invalid JSON format for pricePerThousand:', error);
            }
          }

          if (isWithinDistance && isWithinRange) {
            filteredMatches.push({
              id: merchant.id,
              name: merchant.MerchantProfile.dataValues.displayname,
              avatar: merchant.MerchantProfile.dataValues.imageUrl,
              online: merchant.isOnline,
              badge: 'Verified',
              priceRanges: merchant.UserMerchantAds,
              accuracy: 10,
              distance: matches[i].distance,
              numberOfOrder: OrdersModelResult,
            });
          }
        }
        //await new Promise((resolve) => setTimeout(resolve, 20000));

        return filteredMatches;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetMerchantProfile(data) {
    const { userId } =
      await userUtil.verifyHandleGetMerchantProfile.validateAsync(data);

    return await this.MerchantProfileModel.findOne({
      userId,
    });
  }

  async handleSignupMerchant(data) {
    const { displayname, userId, nin, ninName } =
      await userUtil.verifyHandleSignupMerchant.validateAsync(data);

    try {
      const UserModelResult = await this.UserModel.findOne({
        id: userId,
      });
      await UserModelResult.update({ nin, ninName, accountStatus: true });

      await this.MerchantProfileModel.create({
        displayname: displayname,
        accountTier: 1,
        userId: userId,
        accountStatus: 'active',
      });
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }
  /*
  async handleOrderAcceptOrCancel(data) {
    const { orderId, userId, type, reason } =
      await userUtil.verifyHandleOrderAcceptOrCancel.validateAsync(data);
    //try {

    const OrdersModelResult = await this.OrdersModel.findByPk(orderId);
    if (!OrdersModelResult) throw new NotFoundError('Order not found');
    if (type === 'cancel') {
      if (OrdersModelResult.orderStatus !== 'completed') {
        try {
          await this.refundOrderTransaction(
            OrdersModelResult,
            'cancelled',
            reason
          );
        } catch (error) {
          new SystemError(error);
        }
      } else {
        throw new ConflictError(
          `Order already ${OrdersModelResult.orderStatus}`
        );
      }
    } else if (type === 'reject') {
      if (
        OrdersModelResult.orderStatus !== 'completed' &&
        OrdersModelResult.orderStatus !== 'rejected'
      ) {
        /*
        OrdersModelResult.update({ orderStatus: 'rejected', reason })
          .then(async () => {
            OrdersModelResult.update({ moneyStatus: 'refund' });
            const settingResult = await this.SettingModel.findByPk(1);
            const merchantAdsModelResult = await this.MerchantAdsModel.findOne({
              where: { userId: OrdersModelResult.merchantId },
            });
            const priceData = this.convertToJson(
              merchantAdsModelResult.pricePerThousand
            );
            const serviceCharge = this.convertToJson(
              settingResult.serviceCharge
            );
            const gatewayService = this.convertToJson(
              settingResult.gatewayService
            );

            const amountSummary = await this.getdeliveryAmountSummary(
              priceData,
              OrdersModelResult.amountOrder,
              serviceCharge,
              gatewayService
            );

            const amount =
              amountSummary.amountOrder +
              amountSummary.merchantCharge +
              amountSummary.serviceCharge;
            await this.updateClientWallet(OrdersModelResult.clientId, amount);
            try {
              await this.sendToDevice(
                userResult.fcmToken, // Assuming `userResult` is the customer
                {
                  title: 'Order Rejected ❌',
                  body: `Your order was rejected. Please try another merchant. The amount has been refunded to your wallet.`,
                },
                {
                  type: 'ORDER_REJECTED',
                  orderId: rejectedOrder.orderId, // Replace with your actual order object
                }
              );
            } catch (error) {
              console.error('Error updating client wallet:', error);
            }
          })
          .catch((error) => {
            console.error('Update failed:', error);
          });
          
        try {
          await this.refundOrderTransaction(
            OrdersModelResult,
            'rejected',
            reason
          );
        } catch (error) {
          new SystemError(error);
        }
      } else {
        throw new ConflictError(
          `Order already ${OrdersModelResult.orderStatus}`
        );
      }
    } else if (type === 'accept') {
      if (OrdersModelResult.orderStatus === 'pending') {
        OrdersModelResult.update({
          orderStatus: 'inProgress',
          startTime: new Date(),
        });
        OrdersModelResult.update({ moneyStatus: 'received' });
      } else {
        throw new ConflictError(
          `Order already ${OrdersModelResult.orderStatus}`
        );
      }
    }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  */

  async handleOrderAcceptOrCancel(data) {
    const { orderId, userId, type, reason } =
      await userUtil.verifyHandleOrderAcceptOrCancel.validateAsync(data);

    const OrdersModelResult = await this.OrdersModel.findByPk(orderId);
    if (!OrdersModelResult) throw new NotFoundError('Order not found');

    let userResult;
    if (OrdersModelResult.clientId === userId) {
      userResult = await this.UserModel.findByPk(OrdersModelResult.merchantId); // Needed for FCM token
    } else {
      userResult = await this.UserModel.findByPk(OrdersModelResult.clientId);
    }
    if (type === 'cancel') {
      if (OrdersModelResult.orderStatus !== 'completed') {
        try {
          await this.refundOrderTransaction(
            OrdersModelResult,
            'cancelled',
            reason
          );

          // 🔔 Send cancel notification
          try {
            await this.sendToDevice(
              userResult.fcmToken,
              {
                title: 'Order Cancelled ❌',
                body: 'Your order was cancelled and refunded to your wallet.',
              },
              {
                type: 'ORDER_CANCELLED',
                orderId: OrdersModelResult.id,
              }
            );
          } catch (error) {
            console.error('Notification failed (cancel):', error);
          }
        } catch (error) {
          throw new SystemError(error);
        }
      } else {
        throw new ConflictError(
          `Order already ${OrdersModelResult.orderStatus}`
        );
      }
    } else if (type === 'reject') {
      if (
        OrdersModelResult.orderStatus !== 'completed' &&
        OrdersModelResult.orderStatus !== 'rejected'
      ) {
        try {
          await this.refundOrderTransaction(
            OrdersModelResult,
            'rejected',
            reason
          );

          // 🔔 Send rejection notification
          try {
            await this.sendToDevice(
              userResult.fcmToken,
              {
                title: 'Order Rejected ❌',
                body: `Your order was rejected. Please try another merchant. The amount has been refunded to your wallet.`,
              },
              {
                type: 'ORDER_REJECTED',
                orderId: OrdersModelResult.id,
              }
            );
          } catch (error) {
            console.error('Notification failed (reject):', error);
          }
        } catch (error) {
          throw new SystemError(error);
        }
      } else {
        throw new ConflictError(
          `Order already ${OrdersModelResult.orderStatus}`
        );
      }
    } else if (type === 'accept') {
      if (OrdersModelResult.orderStatus === 'pending') {
        await OrdersModelResult.update({
          orderStatus: 'inProgress',
          startTime: new Date(),
        });
        await OrdersModelResult.update({ moneyStatus: 'received' });

        // 🔔 Send accept notification
        try {
          await this.sendToDevice(
            userResult.fcmToken,
            {
              title: 'Order Accepted ✅',
              body: 'Your order has been accepted and is now in progress.',
            },
            {
              type: 'ORDER_ACCEPTED',
              orderId: OrdersModelResult.id,
            }
          );
        } catch (error) {
          console.error('Notification failed (accept):', error);
        }
      } else {
        throw new ConflictError(
          `Order already ${OrdersModelResult.orderStatus}`
        );
      }
    }
  }

  async handleGetSettings() {
    try {
      const settings = await this.SettingModel.findByPk(1);
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetMyOrderDetails(data) {
    const { orderId, userType, userId } =
      await userUtil.verifyHandleGetMyOrderDetails.validateAsync(data);

    const orderResult = await this.OrdersModel.findByPk(orderId);

    if (!orderResult) throw new NotFoundError('Order not found');

    try {
      const merchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { UserId: orderResult.merchantId },
      });
      const userResult = await this.UserModel.findByPk(orderResult.clientId);
      const merchantResult = await this.UserModel.findOne({
        where: { id: orderResult.merchantId },
        include: [
          {
            model: MerchantProfile,
            as: 'MerchantProfile',
            attributes: ['displayname', 'tel', 'imageUrl'],
          },
        ],
      });
      const settingResult = await this.SettingModel.findByPk(1);

      const priceData = this.convertToJson(
        merchantAdsModelResult.pricePerThousand
      );

      const serviceCharge = this.convertToJson(settingResult.serviceCharge);

      const gatewayService = this.convertToJson(settingResult.gatewayService);

      const AmountSummary = this.getdeliveryAmountSummary(
        priceData,
        orderResult.amountOrder,
        serviceCharge,
        gatewayService
      );
      if (userType === 'client') {
        let estimatedDeliveryTime;
        let distance;
        if (orderResult.orderStatus === 'inProgress') {
          distance = this.calculateDistance(
            userResult.lat,
            userResult.lng,
            merchantResult.lat,
            merchantResult.lng
          );

          estimatedDeliveryTime = this.getEstimatedDeliveryTimeByFoot(distance);
        }

        return {
          orderDetails: {
            qrCodeHash: orderResult.qrCodeHash,
            id: orderResult.id,
            orderId: orderResult.orderId,
            distance: distance || orderResult.distance,
            amount: orderResult.amount,
            amountOrder: orderResult.amountOrder,
            orderStatus: orderResult.orderStatus,
            estimatedDeliveryTime,
            isOnline: userResult.isOnline,
            startTime: orderResult.startTime,
            endTime: orderResult.endTime,
            clientId: orderResult.clientId,
            merchantId: orderResult.merchantId,
            userDetails: {
              displayname:
                merchantResult.MerchantProfile.dataValues.displayname,
              tel: merchantResult.tel,
              image: merchantResult.MerchantProfile.imageUrl,
              merchantAds: merchantAdsModelResult,
              sourceCoordinate: {
                lat: userResult.lat,
                lng: userResult.lng,
              },
              destinationCoordinate: {
                lat: merchantResult.lat,
                lng: merchantResult.lng,
              },
            },
          },
        };
      } else if (userType === 'merchant') {
        let estimatedDeliveryTime;
        let distance;
        if (orderResult.orderStatus === 'inProgress') {
          distance = this.calculateDistance(
            userResult.lat,
            userResult.lng,
            merchantResult.lat,
            merchantResult.lng
          );

          estimatedDeliveryTime = this.getEstimatedDeliveryTimeByFoot(distance);
        }
        return {
          orderDetails: {
            id: orderResult.id,
            orderId: orderResult.orderId,
            distance: distance || orderResult.distance,
            amount: orderResult.amount,
            amountOrder: orderResult.amountOrder,
            orderStatus: orderResult.orderStatus,
            estimatedDeliveryTime,
            isOnline: userResult.isOnline,
            startTime: orderResult.startTime,
            endTime: orderResult.endTime,
            clientId: orderResult.clientId,
            merchantId: orderResult.merchantId,
            userDetails: {
              displayname: userResult.firstName + ' ' + userResult.lastName,
              tel: userResult.tel,
              image: userResult.imageUrl,
              destinationCoordinate: {
                lat: userResult.lat,
                lng: userResult.lng,
              },
              sourceCoordinate: {
                lat: merchantResult.lat,
                lng: merchantResult.lng,
              },
            },
          },
        };
      }
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetOrderStatistic(data) {
    const { userId } =
      await userUtil.verifyHandleGetOrderStatistic.validateAsync(data);
    try {
      const UserModelResult = await this.UserModel.findByPk(userId);
      const CompletedCount = await this.OrdersModel.count({
        where: {
          merchantId: userId,
          orderStatus: 'completed',
          hasIssues: false,
        },
      });
      const CancellCount = await this.OrdersModel.count({
        where: { merchantId: userId, orderStatus: 'cancelled' },
      });

      const PendingCount = await this.OrdersModel.count({
        where: { merchantId: userId, orderStatus: 'pending' },
      });
      const InProgressCount = await this.OrdersModel.count({
        where: { merchantId: userId, orderStatus: 'inProgress' },
      });
      const OrdersModelResult = await this.OrdersModel.findAll({
        where: { orderStatus: 'inProgress', merchantId: userId },
      });
      const merchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId },
      });
      const settingResult = await this.SettingModel.findByPk(1);
      let totalMerchantCharge = 0;

      const priceData = this.convertToJson(
        merchantAdsModelResult.pricePerThousand
      );
      const serviceCharge = this.convertToJson(settingResult.serviceCharge);
      const gatewayService = this.convertToJson(settingResult.gatewayService);

      for (let order of OrdersModelResult) {
        console.log('order.amountOrder');
        console.log(order.amountOrder);
        console.log('order.amountOrder');
        const amountSummary = await this.getdeliveryAmountSummary(
          priceData,
          order.amountOrder,
          serviceCharge,
          gatewayService
        );

        totalMerchantCharge +=
          amountSummary.amountOrder + amountSummary.merchantCharge;
      }
      console.log(UserModelResult.walletBalance);
      const balance =
        this.convertToJson(UserModelResult.walletBalance)?.current || 0;
      // const balance = JSON.parse(UserModelResult.walletBalance).current;
      return {
        Balance: balance,
        EscrowBalance: totalMerchantCharge,
        CompletedCount,
        PendingCount,
        CancellCount,
        InProgressCount,
      };
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleWhoIAm(data) {
    const { userId } = await userUtil.verifyHandleWhoIAm.validateAsync(data);

    try {
      let userResult = await this.UserModel.findOne({
        where: {
          id: userId,
          isEmailValid: true,
          isDeleted: false,
        },
        attributes: {
          exclude: [
            'password',
            'refreshToken',
            'nin',
            'telCode',
            'passCode',
            'isDeleted',
            'ipAdress',
            'notificationId',
            'disableAccount',
          ],
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

      return userResult;
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateAdmin(data) {
    const { userId, ...updateData } =
      await userUtil.verifyHandleUpdateAdmin.validateAsync(data);
    try {
      const adminResult = await this.AdminModel.findByPk(userId);
      if (!adminResult) throw new NotFoundError('Admin not found');
      await adminResult.update(updateData);
      return adminResult;
    } catch (error) {
      console.error('Error updating admin:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetAdmins(data) {
    const { userId } = await userUtil.verifyHandleGetAdmins.validateAsync(data);
    try {
      const admins = await this.AdminModel.findAll({
        where: { isDeleted: false },
        attributes: [
          'id',
          'emailAddress',
          'firstName',
          'role',
          'privilege',
          'createdAt',
          'disableAccount',
        ],
      });
      return admins;
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetTransaction(data) {
    try {
      return await this.TransactionModel.findAll();
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleCreateAdmin(data) {
    const { emailAddress, password, privilege, firstName, lastName } =
      await userUtil.verifyHandleCreateAdmin.validateAsync(data);
    try {
      const hashedPassword = await bcrypt.hash(
        password,
        Number(serverConfig.SALT_ROUNDS)
      );
      const adminResult = await this.AdminModel.create({
        emailAddress,
        password: hashedPassword,
        firstName,
        lastName,
        privilege,
        image:
          'https://res.cloudinary.com/dvznn9s4g/image/upload/v1744630235/avatar_inchq3.jpg',
      });

      await this.sendEmailCredential(emailAddress, password, firstName);
      return adminResult;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetUsers(data) {
    const { type } = await userUtil.verifyHandleGetUsers.validateAsync(data);

    try {
      const whereCondition = {};
      if (type === 'merchant') {
        whereCondition.merchantActivated = true;
      }
      else{
          whereCondition.merchantActivated = false;

      }

      const totalUsers = await this.UserModel.count({ where: whereCondition });
      const activeUsers = await this.UserModel.count({
        where: { ...whereCondition, isOnline: true },
      });
      const newUsersThisMonth = await this.UserModel.count({
        where: {
          ...whereCondition,
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(1)), // First day of the current month
          },
        },
      });

      const users = await this.UserModel.findAll({
        where: whereCondition,
        attributes: [
          'id',
          'imageUrl',
          'emailAddress',
          'firstName',
          'lastName',
          'walletBalance',
          'createdAt',
          'disableAccount',
          'merchantActivated',
          'tel',
          'isOnline',
        ],
        include: [
          {
            model: Orders,
            as: 'ClientOrder',
            // attributes: ['id'],
            required: false,
          },
          {
            model: Orders,
            as: 'MerchantOrder',
            // attributes: ['id'],
            required: false,
          },

          {
            model: MerchantProfile,
            as: 'MerchantProfile',
            required: false,
          },
        ],
      });
     console.log(users)
     //
      const userData = users.map((user) => ({
        id: user.id,
        avatar:
          type === 'merchant' && user.MerchantProfile
            ? user.MerchantProfile.imageUrl
            : user.imageUrl,
        email: user.emailAddress,
        name:
          type === 'merchant'
            ? `${user.firstName} ${user.lastName}(${user.MerchantProfile.displayName})`
            : `${user.firstName} ${user.lastName}`,
        walletBalance:   this.safeParse(user.walletBalance)?.current,
        orders: user.ClientOrder.length + user.MerchantOrder.length,
        dateJoined: user.createdAt,
        accountStatus: user.disableAccount ? 'Disabled' : 'Active',
        merchantStatus: user.merchantActivated,
        merchantAccountStatus: user?.MerchantProfile?.accountStatus,
        tel: user.tel,
        isOnline: user.isOnline,
      }));

      return {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        users: userData,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetUsersData(data) {
    const { userId } = await userUtil.verifyHandleGetUsersData.validateAsync(
      data
    );
    try {
      const user = await this.UserModel.findOne({
        where: { id: userId },
        attributes: [
          'id',
          'imageUrl',
          'emailAddress',
          'firstName',
          'lastName',
          'walletBalance',
          'createdAt',
          'disableAccount',
          'merchantActivated',
          'tel',
          'bankName',
          'bankCode',
          'settlementAccount',
        ],
        include: [
          {
            model: Orders,
            as: 'MerchantOrder',
            attributes: [
              'id',
              'orderStatus',
              'moneyStatus',
              'transactionTime',
              'sessionId',
              'distance',
              'amountOrder',
              'totalAmount',
              'rating',
              'qrCodeHash',
              'hasIssues',
              'note',
              'transactionId',
              'createdAt',
              'merchantId',
            ],
            required: false,
          },
          {
            model: MerchantProfile,
            as: 'MerchantProfile',
            attributes: [
              'id',
              'displayName',
              'tel',
              'imageUrl',
              'accountTier',
              'accountStatus',
              'deliveryRange',
              'walletBalance',
              'disableAccount',
            ],
            required: false,
          },
        ],
      });

      if (!user) {
        throw new SystemError('UserNotFound', 'User does not exist');
      }
      // console.log(user);
      const userData = {
        id: user.id,
        avatar:
          user.merchantActivated && user.MerchantProfile
            ? user.MerchantProfile.imageUrl
            : user.imageUrl,
        email: user.emailAddress,
        name:
          user.merchantActivated && user.MerchantProfile
            ? `${user.firstName} ${user.lastName} (${user.MerchantProfile.displayName})`
            : `${user.firstName} ${user.lastName}`,
        walletBalance: user.walletBalance?.current || 0,
        orders:
          (user.ClientOrder?.length || 0) + (user.MerchantOrder?.length || 0),
        dateJoined: user.createdAt,
        accountStatus: user.disableAccount ? 'Disabled' : 'Active',
        merchantStatus: user.merchantActivated,
        tel: user.tel,
        bankDetails: user.bankName
          ? {
              bankName: user.bankName,
              bankCode: user.bankCode,
              settlementAccount: user.settlementAccount,
            }
          : null,
        merchantProfile: user.MerchantProfile
          ? {
              id: user.MerchantProfile.id,
              displayName: user.MerchantProfile.displayName,
              tel: user.MerchantProfile.tel,
              imageUrl: user.MerchantProfile.imageUrl,
              accountTier: user.MerchantProfile.accountTier,
              accountStatus: user.MerchantProfile.accountStatus,
              deliveryRange: user.MerchantProfile.deliveryRange,
              walletBalance: user.MerchantProfile.walletBalance,
              disableAccount: user.MerchantProfile.disableAccount,
            }
          : null,
      };

      const orders = [
        ...user.MerchantOrder.map((order) => ({
          orderId: order.id,
          clientId: user.id,
          merchantId: order.merchantId,
          status: order.orderStatus,
          moneyStatus: order.moneyStatus,
          transactionTime: order.transactionTime,
          sessionId: order.sessionId,
          distance: order.distance,
          amountOrder: order.amountOrder,
          totalAmount: order.totalAmount,
          rating: order.rating,
          qrCodeHash: order.qrCodeHash,
          hasIssues: order.hasIssues,
          note: order.note,
          transactionId: order.transactionId,
          createdAt: order.createdAt,
        })),
      ];

      return { user: userData, orders };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateMerchantStatus(data) {
    const { userId, ...updateData } =
      await userUtil.verifyHandleUpdateMerchantStatus.validateAsync(data);
    try {
      const UserModelResult = await this.UserModel.findByPk(userId);

      if (updateData.accountStatus === 'active') {
        await UserModelResult.update({
          merchantActivated: true,
        });
        await this.MerchantProfileModel.update(
          { accountStatus: 'active' },
          { where: { userId: userId } }
        );
      } else {
        console.log('updateData', updateData.accountStatus);
        console.log('userId', userId);

        await this.MerchantProfileModel.update(
          { accountStatus: updateData.accountStatus },
          { where: { userId: userId } }
        );
      }
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleTransferMoney(data) {
    const { passCode, amount, userId, sessionId } =
      await userUtil.verifyHandleNameEnquiry.validateAsync(data);

    try {
      const userResult = await this.UserModel.findByPk(userId);

      let myPassCode = passCode + '';

      if (!(await bcrypt.compare(myPassCode, userResult.passCode))) return null;
      if (!this.gateway) {
        await this.loadGateWay();
      }
      return {};
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleNameEnquiry(data) {
    const { userId, bankCode, accountNumber } =
      await userUtil.verifyHandleNameEnquiry.validateAsync(data);
    if (!this.gateway) {
      await this.loadGateWay();
    }
    try {
      return {};
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetBank(data) {
    const { userId } = await userUtil.verifyHandleGetBank.validateAsync(data);
    try {
      return {};
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleDashBoardStatistic(data) {
    const { userId } =
      await userUtil.verifyHandleDashBoardStatistic.validateAsync(data);
    try {
      const userResult = await this.UserModel.count({
        where: { isEmailValid: true },
      });
      const userMerchantResult = await this.UserModel.count({
        where: { isEmailValid: true, merchantActivated: true },
      });
      const settingModelResult = await this.SettingModel.findByPk(1);
      const OrdersModelResult = await this.OrdersModel.findAll({
        where: { orderStatus: 'inProgress' },
      });
      const merchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId },
      });
      let totalServiceCharge = 0;
      for (let order of OrdersModelResult) {
        const amountSummary = this.getdeliveryAmountSummary(
          merchantAdsModelResult.pricePerThousand,
          order.amountOrder,
          settingModelResult.serviceCharge,
          settingModelResult.gatewayService
        );
        totalServiceCharge += amountSummary.serviceCharge;
      }
      const orderStatusCancelled = await this.OrdersModel.count({
        where: { orderStatus: 'cancelled', isDeleted: false },
      });
      const orderStatusInProgress = await this.OrdersModel.count({
        where: { orderStatus: 'inProgress', isDeleted: false },
      });
      const orderStatusCompleted = await this.OrdersModel.count({
        where: { orderStatus: 'completed', isDeleted: false },
      });
      const adminCount = await this.AdminModel.count({
        where: { isDeleted: false },
      });

      const pendingRequest = await this.MerchantProfileModel.count({
        where: { isDeleted: false, accountStatus: 'processing' },
      });

      return {
        numberOfUser: userResult,
        numberOfMerchant: userMerchantResult,
        balance: settingModelResult.walletBalance,
        EscrowBalance: totalServiceCharge,
        orderStatusCancelled: orderStatusCancelled,
        orderStatusInProgress: orderStatusInProgress,
        orderStatusCompleted: orderStatusCompleted,
        adminCount: adminCount,
        pendingRequest: pendingRequest,
      };
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetMyAds(data) {
    const { userId } = await userUtil.verifyHandleGetMyAds.validateAsync(data);
    try {
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId },
      });
      if (!MerchantAdsModelResult) return [];
      MerchantAdsModelResult.pricePerThousand = JSON.parse(
        MerchantAdsModelResult.pricePerThousand
      );
      return MerchantAdsModelResult;
    } catch (error) {
      console.error('Error fetching default with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetdefaultAds(data) {
    const { userId } = await userUtil.verifyHandleGetdefaultAds.validateAsync(
      data
    );
    try {
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId },
      });
      let adsData = {};
      if (MerchantAdsModelResult) {
        adsData = {
          min: MerchantAdsModelResult.minAmount,
          max: MerchantAdsModelResult.maxAmount,
          breaks: JSON.parse(MerchantAdsModelResult.pricePerThousand),
        };
      } else {
        const settingModelResult = await this.SettingModel.findByPk(1);
        const settingModelResultPared = JSON.parse(
          settingModelResult.defaultAds
        );

        adsData = {
          min: 1000,
          max: 10000,
          breaks: settingModelResultPared,
        };
      }

      return adsData;
    } catch (error) {
      console.error('Error fetching default with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleManageBreakPoint(data) {
    const { userId, action, breakPoint } =
      await userUtil.verifyHandleManageBreakPoint.validateAsync(data);

    try {
      const setting = await this.SettingModel.findByPk(1);

      if (!setting) {
        throw new Error('Settings not found');
      }
      console.log('action', action);
      await setting.update({ breakPoint });
      return { message: 'Breakpoints updated successfully' };

      // Unknown action
      // throw new Error('Invalid action. Use "get" or "update".');
    } catch (error) {
      console.error('Error handling breakPoint:', error);
      throw new SystemError(error.name, error.parent || error.message);
    }
  }

  async safeParse(input) {
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch (e) {
        console.error('Failed to parse:', e);
        return {};
      }
    }
    return input || {};
  }
  async handleSubmitComplain(data) {
    const { userId } = await userUtil.verifyHandleSubmitComplain.validateAsync(
      data
    );
    await this.ComplaintModel.create({});
    try {
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateMerchantVerificationProcess(data) {
    const { userId, markVerification } =
      await userUtil.verifyHandleSetMerchantAccountStatus.validateAsync(data);
    try {
      const UserModelResult = await this.UserModel.findOne({
        where: { userId },
      });
      if (markVerification === 'NinVerified') {
        await UserModelResult.update({ isNinVerified: true });
      } else if (markVerification === 'FaceVerified') {
        await UserModelResult.update({ isFaceVerified: true });
      } else if (markVerification === 'DisplayNameMerchantSet') {
        await UserModelResult.update({ isDisplayNameMerchantSet: true });
      }
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleSetWithdrawalBank(data) {
    const { userId, ba, endDate } =
      await userUtil.verifyHandleSetWithdrawalBank.validateAsync(data);
    try {
      // Define date filter if provided
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)],
              },
            }
          : {};

      // Query transactions
      const transactions = await Transaction.findAll({
        where: {
          isDeleted: false,
          userId,
          transactionType: 'order',
          dateFilter,
        },
        limit: startDate && endDate ? undefined : 15, // Limit to 15 if no date range provided
        include: [
          {
            model: this.OrdersModel,
            as: 'OrderTransaction',
            where: { isDeleted: false },
            include: [
              {
                model: this.UserModel,
                as: 'merchantOrder',
                attributes: ['firstName', 'lastName', 'emailAddress', 'tel'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Transform and return data
      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        paymentStatus: transaction.paymentStatus,
        transactionType: transaction.transactionType,
        orderDetails: transaction.Order
          ? {
              id: transaction.Order.id,
              amountOrder: transaction.Order.amountOrder,
              totalAmount: transaction.Order.totalAmount,
              orderStatus: transaction.Order.orderStatus,
            }
          : null,
        merchantDetails: transaction.Order?.Merchant
          ? {
              firstName: transaction.Order.merchantOrder.firstName,
              lastName: transaction.Order.merchantOrder.lastName,
              emailAddress: transaction.Order.merchantOrder.emailAddress,
              tel: transaction.Order.merchantOrder.tel,
              profile: transaction.Order.merchantOrder.MerchantProfile || null,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetTransactionHistory(data) {
    const { userId, limit, startDate, endDate } =
      await userUtil.verifyHandleGetTransactionHistory.validateAsync(data);
    try {
      // Define date filter if provided
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)],
              },
            }
          : {};

      // Query transactions
      const transactions = await this.TransactionModel.findAll({
        where: {
          isDeleted: false,
          userId,
          // transactionType: 'order',
          ...(dateFilter && { ...dateFilter }),
        },
        limit: startDate && endDate ? undefined : limit,
        include: [
          {
            model: this.OrdersModel,
            as: 'TransactionOrder',
            where: { isDeleted: false },
            include: [
              {
                model: this.UserModel,
                as: 'OrderMerchant',
                attributes: ['firstName', 'lastName', 'emailAddress', 'tel'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        paymentStatus: transaction.paymentStatus,
        transactionType: transaction.transactionType,
        orderDetails: transaction.Order
          ? {
              id: transaction.Order.id,
              amountOrder: transaction.Order.amountOrder,
              totalAmount: transaction.Order.totalAmount,
              orderStatus: transaction.Order.orderStatus,
            }
          : null,
        merchantDetails: transaction.Order?.Merchant
          ? {
              firstName: transaction.Order.merchantOrder.firstName,
              lastName: transaction.Order.merchantOrder.lastName,
              emailAddress: transaction.Order.merchantOrder.emailAddress,
              tel: transaction.Order.merchantOrder.tel,
              profile: transaction.Order.merchantOrder.MerchantProfile || null,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetGeneralTransaction(data) {
    const {
      userId,
      limit,
      offset = 0,
      startDate,
      endDate,
    } = await userUtil.verifyHandleGetGeneralTransactionHistory.validateAsync(
      data
    );

    try {
      // Define date filter if provided
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)],
              },
            }
          : {};

      // Query transactions with pagination and latest-first ordering
      const transactions = await this.TransactionModel.findAll({
        where: {
          isDeleted: false,
          userId,
          ...(dateFilter && { ...dateFilter }),
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      // Format each transaction
      const formattedTransactions = transactions.map((txn) => {
        let type, title, initials;

        switch (txn.transactionType) {
          case 'order':
            type = 'outgoing';
            title = 'Order Payment';
            initials = 'OP';
            break;
          case 'widthdrawal':
            type = 'outgoing';
            title = 'Withdrawal';
            initials = 'WD';
            break;
          case 'fundwallet':
            type = 'incoming';
            title = 'Wallet Funding';
            initials = 'WF';
            break;
          default:
            type = 'unknown';
            title = 'Transaction';
            initials = 'TX';
        }

        return {
          id: txn.transactionId,
          title,
          initials,
          date: `${this.formatDate(txn.createdAt)}`,
          type,
          amount: `${txn.amount} ₦`,
          paymentStatus: txn.paymentStatus,
        };
      });

      return formattedTransactions;
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }

  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async handleGetTransactionHistoryOrder(data) {
    const { userId, startDate, endDate } =
      await userUtil.verifyHandleGetTransactionHistoryOrder.validateAsync(data);

    try {
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)],
              },
            }
          : {};

      // Query transactions
      const transactions = await Transaction.findAll({
        where: {
          isDeleted: false,
          userId,
          transactionType: 'order',
          ...dateFilter, // ✅ Correct usage of dateFilter
        },
        limit: startDate && endDate ? undefined : 15, // Limit to 15 if no date range provided
        include: [
          {
            model: this.OrdersModel,
            as: 'OrderTransaction',
            where: { isDeleted: false },
            required: false,
            include: [
              {
                model: this.UserModel,
                as: 'OrderMerchant',
                required: true,
                attributes: ['id'],
                include: [
                  {
                    model: MerchantProfile,
                    as: 'MerchantProfile',
                    attributes: ['id', 'displayName', 'imageUrl'],
                  },
                ],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // console.log('transactions', transactions[0].OrderTransaction);
      // Transform and return data
      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        paymentStatus: transaction.paymentStatus,
        transactionType: transaction.transactionType,
        orderDetails: transaction.OrderTransaction
          ? {
              id: transaction.OrderTransaction.orderId,
              amountOrder: transaction.OrderTransaction.amountOrder,
              totalAmount: transaction.OrderTransaction.totalAmount,
              orderStatus: transaction.OrderTransaction.orderStatus,
            }
          : null,
        merchantDetails: transaction.OrderTransaction?.OrderMerchant
          .MerchantProfile
          ? {
              name: transaction.OrderTransaction.OrderMerchant.MerchantProfile
                .displayName,
              imageUrl:
                transaction.OrderTransaction.OrderMerchant.MerchantProfile
                  .imageUrl,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new SystemError(error.name, error.parent || error.message);
    }
  }
  /*
  async handleverifyCompleteOrder(data) {
    try {
      // Validate the input data
      const { userId, orderId, hash } =
        await userUtil.verifyHandleverifyCompleteOrder.validateAsync(data);

      // Fetch the order by ID
      const orderResult = await this.OrdersModel.findByPk(orderId);
      if (!orderResult) {
        throw new NotFoundError(`Order with ID ${orderId} not found.`);
      }

      if (orderResult.orderStatus === 'completed') {
        throw new ConflictError(`Order marked as completed already.`);
      } else if (
        orderResult.orderStatus === 'cancelled' ||
        orderResult.orderStatus === 'rejected'
      ) {
        throw new ConflictError(
          `Order marked as ${orderResult.orderStatus} already.`
        );
      }

      // Validate that the correct user is accessing
      const userResult = await this.UserModel.findByPk(orderResult.clientId);
      if (!userResult) {
        throw new NotFoundError(
          `Client with ID ${orderResult.clientId} not found.`
        );
      }

      // Construct hash and compare
      const unConvertedHash =
        orderResult.clientId +
        orderResult.merchantId +
        userResult.password +
        serverConfig.GET_QR_CODE_HASH;

      const isValidHash = await bcrypt.compare(unConvertedHash, hash);

      if (!isValidHash) {
        throw new BadRequestError('The provided hash is invalid or tampered.');
      }

      // Fetch merchant ad
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId: orderResult.merchantId },
      });
      if (!MerchantAdsModelResult) {
        throw new NotFoundError('No ad found for this merchant.');
      }

      // Parse required settings and calculate delivery summary
      const priceData = this.convertToJson(
        MerchantAdsModelResult.pricePerThousand
      );
      const settingResult = await this.SettingModel.findByPk(1);
      if (!settingResult) {
        throw new SystemError('SettingsNotFound', 'System settings not found.');
      }

      const serviceCharge = this.convertToJson(settingResult.serviceCharge);
      const gatewayService = this.convertToJson(settingResult.gatewayService);
      const getdeliveryAmountSummary = await this.getdeliveryAmountSummary(
        priceData,
        orderResult.amountOrder,
        serviceCharge,
        gatewayService
      );

      const merchantPayOut =
        getdeliveryAmountSummary.merchantCharge +
        getdeliveryAmountSummary.amountOrder;
      const commission = getdeliveryAmountSummary.serviceCharge;

      // Update wallets
      await this.updateWallet(userId, orderResult.totalAmount);
      await this.updateAdminWallet(1, commission);
      // Update order status
      await orderResult.update({
        orderStatus: 'completed',
        moneyStatus: 'received',
      });
    } catch (error) {
      console.error('handleverifyCompleteOrder Error:', error); // Optional logging
      // Return or throw a clean error
      if (error instanceof SystemError) {
        throw error; // Already structured
      }
      throw new SystemError(
        'UnexpectedError',
        error.message || 'An unexpected error occurred.'
      );
    }
  }*/

  async handleverifyCompleteOrder(data) {
    try {
      const { userId, orderId, hash } =
        await userUtil.verifyHandleverifyCompleteOrder.validateAsync(data);

      const orderResult = await this.OrdersModel.findByPk(orderId);
      if (!orderResult) {
        throw new NotFoundError(`Order with ID ${orderId} not found.`);
      }

      if (orderResult.orderStatus === 'completed') {
        throw new ConflictError(`Order marked as completed already.`);
      } else if (
        orderResult.orderStatus === 'cancelled' ||
        orderResult.orderStatus === 'rejected'
      ) {
        throw new ConflictError(
          `Order marked as ${orderResult.orderStatus} already.`
        );
      }

      const userResult = await this.UserModel.findByPk(orderResult.clientId);
      const userResult2 = await this.UserModel.findByPk(orderResult.merchantId);

      if (!userResult) {
        throw new NotFoundError(
          `Client with ID ${orderResult.clientId} not found.`
        );
      }

      const unConvertedHash = this.rawOrderHash(
        orderResult.clientId,
        orderResult.merchantId,
        userResult.password,
        orderResult.orderId
      );

      const isValidHash = await bcrypt.compare(unConvertedHash, hash);
      if (!isValidHash) {
        throw new BadRequestError('The provided hash is invalid or tampered.');
      }

      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId: orderResult.merchantId },
      });
      if (!MerchantAdsModelResult) {
        throw new NotFoundError('No ad found for this merchant.');
      }

      const priceData = this.convertToJson(
        MerchantAdsModelResult.pricePerThousand
      );
      const settingResult = await this.SettingModel.findByPk(1);
      if (!settingResult) {
        throw new SystemError('SettingsNotFound', 'System settings not found.');
      }

      const serviceCharge = this.convertToJson(settingResult.serviceCharge);
      const gatewayService = this.convertToJson(settingResult.gatewayService);

      const getdeliveryAmountSummary = await this.getdeliveryAmountSummary(
        priceData,
        orderResult.amountOrder,
        serviceCharge,
        gatewayService
      );

      const merchantPayOut =
        getdeliveryAmountSummary.merchantCharge +
        getdeliveryAmountSummary.amountOrder;
      const commission = getdeliveryAmountSummary.serviceCharge;

      // 💸 Update wallets
      await this.updateWallet(userId, orderResult.totalAmount);
      await this.updateAdminWallet(1, commission);

      // ✅ Mark order completed
      await orderResult.update({
        orderStatus: 'completed',
        moneyStatus: 'received',
      });

      // 🔔 Push notification (non-blocking)
      if (userResult?.fcmToken) {
        try {
          await this.sendToDevice(
            userResult.fcmToken,
            {
              title: 'Order Completed ✅',
              body: 'Your order has been successfully completed.',
            },
            {
              type: 'ORDER_COMPLETED',
              orderId: orderResult.id,
            }
          );
        } catch (notifyErr) {
          console.error('Notification failed (complete order):', notifyErr);
        }
      }
      if (userResult2?.fcmToken) {
        try {
          await this.sendToDevice(
            userResult.fcmToken,
            {
              title: 'Order Completed ✅',
              body: 'Your order has been successfully completed.',
            },
            {
              type: 'ORDER_COMPLETED',
              orderId: orderResult.id,
            }
          );
        } catch (notifyErr) {
          console.error('Notification failed (complete order):', notifyErr);
        }
      }
    } catch (error) {
      console.error('handleverifyCompleteOrder Error:', error);

      if (error instanceof SystemError) {
        throw error;
      }

      throw new SystemError(
        'UnexpectedError',
        error.message || 'An unexpected error occurred.'
      );
    }
  }

  async handleGetChargeSummary(data) {
    const { amount, userId, userId2 } =
      await userUtil.verifyHandleGetChargeSummary.validateAsync(data);
    try {
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId: userId2 },
      });

      if (!MerchantAdsModelResult)
        throw new NotFoundError(
          'Merchant ads not found, check if it has been created'
        );

      const settingModelResult = await this.SettingModel.findByPk(1);
      if (!settingModelResult)
        throw new NotFoundError(
          'admin Setting not found check if admin setting has been created'
        );

      let pricePerThousand = MerchantAdsModelResult.pricePerThousand;
      let serviceCharge = settingModelResult.serviceCharge;
      let gatewayService = settingModelResult.gatewayService;

      if (typeof gatewayService === 'string') {
        try {
          gatewayService = JSON.parse(gatewayService);
        } catch (e) {
          console.error('Failed to parse gatewayService:', e);
        }
      }

      if (typeof serviceCharge === 'string') {
        try {
          serviceCharge = JSON.parse(serviceCharge);
        } catch (e) {
          console.error('Failed to parse serviceCharge:', e);
        }
      }
      if (typeof pricePerThousand === 'string') {
        try {
          pricePerThousand = JSON.parse(pricePerThousand);
        } catch (e) {
          console.error('Failed to parse pricePerThousand:', e);
        }
      }

      const getdeliveryAmountSummary = await this.getdeliveryAmountSummary(
        pricePerThousand,
        amount,
        serviceCharge,
        gatewayService
      );
      return getdeliveryAmountSummary;
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  /*
  async handleMakeOrderPayment(data) {
    const sequelize = this.UserModel.sequelize;
    let validatedData;

    try {
      validatedData = await userUtil.verifyHandleMakeOrderPayment.validateAsync(
        data
      );
    } catch (err) {
      throw new BadRequestError('Invalid input: ' + err.message);
    }

    const { userId, userId2, amount, amountOrder } = validatedData;

    return await sequelize.transaction(async (t) => {
      // 1. Fetch and validate User
      const userResult = await this.UserModel.findByPk(userId, {
        transaction: t,
      });
      if (!userResult) throw new NotFoundError('User not found');

      // Parse wallet safely
      let userWallet = { current: 0, previous: 0 };
      try {
        userWallet =
          typeof userResult.walletBalance === 'string'
            ? JSON.parse(userResult.walletBalance)
            : userResult.walletBalance || { current: 0, previous: 0 };
      } catch (e) {
        console.error('Error parsing user walletBalance:', e);
        throw new SystemError('Corrupt user wallet data');
      }

      const currentUserBalance = Number(userWallet.current) || 0;
      if (currentUserBalance < amount) {
        throw new BadRequestError('Insufficient balance');
      }

      // 2. Fetch and validate Merchant Ad
      const merchantAd = await this.MerchantAdsModel.findOne({
        where: { userId: userId2 },
        transaction: t,
      });
      if (!merchantAd) {
        throw new NotFoundError('Merchant ads not found');
      }

      // 3. Fetch Setting
      const settingModelResult = await this.SettingModel.findByPk(1, {
        transaction: t,
      });
      if (!settingModelResult) {
        throw new InternalServerError('System settings not found');
      }

      // 4. Update User wallet
      const updatedUserWallet = {
        previous: currentUserBalance,
        current: currentUserBalance - amount,
      };
      await userResult.update(
        { walletBalance: updatedUserWallet },
        { transaction: t }
      );

      // 5. Update Setting wallet (service charge)
      let settingWallet = { previous: 0, current: 0 };
      try {
        settingWallet =
          typeof settingModelResult.walletBalance === 'string'
            ? JSON.parse(settingModelResult.walletBalance)
            : settingModelResult.walletBalance || { previous: 0, current: 0 };
      } catch (e) {
        console.error('Error parsing setting walletBalance:', e);
        throw new SystemError('Corrupt setting wallet data');
      }

      const previousSettingBalance = Number(settingWallet.current) || 0;

      let pricePerThousand = merchantAd.pricePerThousand;
      let serviceCharge = settingModelResult.serviceCharge;
      let gatewayService = settingModelResult.gatewayService;

      pricePerThousand = await this.safeParse(pricePerThousand);
      serviceCharge = await this.safeParse(serviceCharge);
      gatewayService = await this.safeParse(gatewayService);

      const amountSummary = await this.getdeliveryAmountSummary(
        pricePerThousand,
        amountOrder,
        serviceCharge,
        gatewayService
      );

      // const serviceCharge = amountSummary.serviceCharge;
      const updatedSettingWallet = {
        previous: previousSettingBalance,
        current: previousSettingBalance + amountSummary.serviceCharge,
      };
      await settingModelResult.update(
        { walletBalance: updatedSettingWallet },
        { transaction: t }
      );

      // 6. Log Transaction
      const transactionResult = await this.TransactionModel.create(
        {
          userId,
          merchantId: userId2,
          orderAmount: amountOrder,
          amount,
          transactionType: 'order',
          paymentStatus: 'successful',
          transactionFrom: 'wallet',
        },
        { transaction: t }
      );

      // 7. Create Order
      const newOrder = await this.OrdersModel.create(
        {
          orderStatus: 'notAccepted',
          moneyStatus: 'received',
          orderId: this.generateOrderId('NG', 10),
          clientId: userId,
          merchantId: userId2,
          amountOrder,
          amount,
          qrCodeHash: await this.getQRCodeHash(
            userId,
            userId2,
            userResult.password
          ),
          transactionId: transactionResult.id,
        },
        { transaction: t }
      );

      const merchantUser = await this.UserModel.findByPk(userId2, {
        transaction: t,
      });
      if (merchantUser && merchantUser.fcmToken) {
        await this.sendToDevice(
          merchantUser.fcmToken,
          {
            title: 'New Order Alert 🚀',
            body: `You’ve received a new order from ${userResult.firstName}. Open the app to accept it.`,
          },
          {
            type: 'NEW_ORDER',
            orderId: newOrder.orderId,
          }
        );
      }

      return {
        success: true,
        message: 'Order payment processed successfully',
      };
    });
  }*/

  async handleMakeOrderPayment(data) {
    const sequelize = this.UserModel.sequelize;
    let validatedData;

    try {
      validatedData = await userUtil.verifyHandleMakeOrderPayment.validateAsync(
        data
      );
    } catch (err) {
      throw new BadRequestError('Invalid input: ' + err.message);
    }

    const { userId, userId2, amount, amountOrder } = validatedData;

    let newOrder, userResult, merchantUser;

    await sequelize.transaction(async (t) => {
      // 1. Fetch and validate User
      userResult = await this.UserModel.findByPk(userId, { transaction: t });
      if (!userResult) throw new NotFoundError('User not found');

      // Parse wallet safely
      let userWallet = { current: 0, previous: 0 };
      try {
        userWallet =
          typeof userResult.walletBalance === 'string'
            ? JSON.parse(userResult.walletBalance)
            : userResult.walletBalance || { current: 0, previous: 0 };
      } catch (e) {
        console.error('Error parsing user walletBalance:', e);
        throw new SystemError('Corrupt user wallet data');
      }

      const currentUserBalance = Number(userWallet.current) || 0;
      if (currentUserBalance < amount) {
        throw new BadRequestError('Insufficient balance');
      }

      // 2. Fetch and validate Merchant Ad
      const merchantAd = await this.MerchantAdsModel.findOne({
        where: { userId: userId2 },
        transaction: t,
      });
      if (!merchantAd) throw new NotFoundError('Merchant ads not found');

      // 3. Fetch Setting
      const settingModelResult = await this.SettingModel.findByPk(1, {
        transaction: t,
      });
      if (!settingModelResult)
        throw new SystemError('System settings not found');

      // 4. Update User wallet
      const updatedUserWallet = {
        previous: currentUserBalance,
        current: currentUserBalance - amount,
      };
      await userResult.update(
        { walletBalance: updatedUserWallet },
        { transaction: t }
      );

      // 5. Update Setting wallet (service charge)
      let settingWallet = { previous: 0, current: 0 };
      try {
        settingWallet =
          typeof settingModelResult.walletBalance === 'string'
            ? JSON.parse(settingModelResult.walletBalance)
            : settingModelResult.walletBalance || { previous: 0, current: 0 };
      } catch (e) {
        console.log('Error parsing setting walletBalance:', e);
        throw new SystemError('Corrupt setting wallet data');
      }

      const previousSettingBalance = Number(settingWallet.current) || 0;

      let pricePerThousand = await this.safeParse(merchantAd.pricePerThousand);
      let serviceCharge = await this.safeParse(
        settingModelResult.serviceCharge
      );
      let gatewayService = await this.safeParse(
        settingModelResult.gatewayService
      );

      const amountSummary = await this.getdeliveryAmountSummary(
        pricePerThousand,
        amountOrder,
        serviceCharge,
        gatewayService
      );

      const updatedSettingWallet = {
        previous: previousSettingBalance,
        current: previousSettingBalance + amountSummary.serviceCharge,
      };
      await settingModelResult.update(
        { walletBalance: updatedSettingWallet },
        { transaction: t }
      );

      // 6. Log Transaction
      const transactionResult = await this.TransactionModel.create(
        {
          userId,
          transactionId: this.generateOrderId('NG_TX', 10),
          merchantId: userId2,
          orderAmount: amountOrder,
          amount,
          transactionType: 'order',
          paymentStatus: 'successful',
          transactionFrom: 'wallet',
        },
        { transaction: t }
      );

      // 7. Create Order
      const orderID = this.generateOrderId('NG', 10);
      newOrder = await this.OrdersModel.create(
        {
          orderStatus: 'pending',
          moneyStatus: 'received',
          orderId: orderID,
          clientId: userId,
          merchantId: userId2,
          amountOrder,
          totalAmount:
            amountSummary.merchantCharge +
            amountSummary.serviceCharge +
            amountSummary.amountOrder,
          qrCodeHash: await this.getQRCodeHash(
            userId,
            userId2,
            userResult.password,
            orderID
          ),
          transactionId: transactionResult.id,
        },
        { transaction: t }
      );

      // Prepare merchant user for later notification
      merchantUser = await this.UserModel.findByPk(userId2, { transaction: t });
    });

    // 🔔 Send push notification outside the transaction
    if (merchantUser && merchantUser.fcmToken) {
      try {
        await this.sendToDevice(
          merchantUser.fcmToken,
          {
            title: 'New Order Alert 🚀',
            body: `You’ve received a new order from ${userResult.firstName}. Open the app to accept it.`,
          },
          {
            type: 'NEW_ORDER',
            orderId: newOrder.orderId,
          }
        );
      } catch (notificationError) {
        console.warn('Push notification failed:', notificationError);
        // Do not throw — just log and continue
      }
    }

    return {
      success: true,
      message: 'Order payment processed successfully',
    };
  }

  generateOrderId(prefix, totalLength) {
    const sanitizedPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomLength = totalLength - sanitizedPrefix.length;

    if (randomLength <= 0) {
      throw new Error('Total length must be greater than prefix length.');
    }

    const nanoid = getNanoid(randomLength);
    const id = `${sanitizedPrefix}${nanoid()}`;
    return id;
  }

  async handleConfirmTransfer(data) {
    const { userId, amount, sessionId } =
      await userUtil.verifyHandleConfirmTransfer.validateAsync(data);
    try {
      const TransactionModelResult = await this.TransactionModel.findOne({
        where: { sessionId },
      });
      if (!TransactionModelResult)
        throw new NotFoundError('Transaction not found');
      const OrderModelResult = await this.OrdersModel.findOne({
        where: { id: TransactionModelResult.orderId },
      });
      if (!OrderModelResult) throw new NotFoundError('Order not found');
      await OrderModelResult.update({ orderStatus: 'completed' });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGenerateAccountVirtual(data) {
    const { amount, userId, userId2, type } =
      await userUtil.verifyHandleGenerateAccountVirtual.validateAsync(data);

    const settingModelResult = await this.SettingModel.findByPk(1);
    if (!settingModelResult) throw new NotFoundError('Setting not found');

    try {
      if (settingModelResult.activeGateway === 'safeHaven.gateway') {
        if (type == 'fundWallet') {
          const sessionIdVirtualAcct = `session${Date.now()}-${Math.floor(
            Math.random() * 100000
          )}`;

          const transactionModelResult = await this.TransactionModel.create({
            userId,
            amount,
            transactionId: this.generateOrderId('NG_TX', 10),
            transactionType: 'fundWallet',
            paymentStatus: 'pending',
            transactionFrom: 'external',
            sessionIdVirtualAcct,
          });

          const generateVirtualAccountResult = {
            bankName: 'kuda',
            accountNumber: '393939939393',
            accountName: 'chinaza ogbonna',
            sessionId: sessionIdVirtualAcct,
            countDown: 60,
          };

          return generateVirtualAccountResult;

          /*
          const generateVirtualAccountResult =
            await this.gateway.generateVirtualAccount(
              this.validFor,
              amount,
              settingModelResult.callbackUrl,
              transactionModelResult.id
            );

          return generateVirtualAccountResult;*/
        } else {
          const sessionIdVirtualAcct = `session${Date.now()}-${Math.floor(
            Math.random() * 100000
          )}`;
          const generateVirtualAccountResult = {
            bankName: 'kuda',
            accountNumber: '393939939393',
            accountName: 'chinaza ogbonna',
            sessionId: sessionIdVirtualAcct,
          };

          await this.TransactionModel.create({
            userId,
            amount,
            transactionId: this.generateOrderId('NG_TX', 10),
            transactionType: 'order',
            paymentStatus: 'pending',
            transactionFrom: 'external',
            merchantId: userId2,
            sessionIdVirtualAcct,
          });

          return generateVirtualAccountResult;
          /*const generateVirtualAccountResult =
            await this.gateway.generateVirtualAccount(
              this.validFor,
              amount,
              settingModelResult.callbackUrl,
              transactionModelResult.id
            );

          return generateVirtualAccountResult;*/
        }

        /*
        const sessionId = `session${Date.now()}-${Math.floor(
          Math.random() * 100000
        )}`;
        const generateVirtualAccountResult = {
          bankName: 'kuda',
          accountNumber: '393939939393',
          accountName: 'chinaza ogbonna',
          sessionId,
          getdeliveryAmountSummary,
        };

        /**
         * -accountniumber
         * -sessionIdVirtualAcct
         * -orderId
         */
        /*generateVirtualAccountResult[fieldName] = newValue; // Update the specific field
          await transaction.save(); */

        /**************************************************** 
    TAKE OUT THIS SECTION IS FOR TESTING 
*****************************************************/

        /*
        const successufullPayment = {
          _id: '1212334556654',
          client: '',
          virtualAccount: {
            sessionId,
            nameEnquiryReference: '',
            paymentReference: TransactionModelResult.id,
            isReversed: true,
            reversalReference: '',
            provider: '',
            providerChannel: '',
            providerChannelCode: '',
            destinationInstitutionCode: '',
            creditAccountName: '',
            creditAccountNumber: '',
            creditBankVerificationNumber: '',
            creditKYCLevel: '',
            debitAccountName: '',
            debitAccountNumber: '',
            debitBankVerificationNumber: '',
            debitKYCLevel: '',
            transactionLocation: '',
            narration: '',
            amount: getdeliveryAmountSummary.totalAmount,
            fees: 0,
            vat: 0,
            stampDuty: 0,
            responseCode: '',
            responseMessage: '',
            status: 'PAID',
            isDeleted: true,
            createdAt: '',
            declinedAt: '',
            updatedAt: '',
            __v: 0,
          },
        };

        this.writeToDirect(successufullPayment);

        /**************************************************** 
    END OF THE SECTION
*****************************************************/

        return generateVirtualAccountResult;
      }
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  /*
  async handleGenerateAccountVirtual(data) {
    const { amount, userId, userId2 } =
      await userUtil.verifyHandleGenerateAccountVirtual.validateAsync(data);
    try {
      const OrderModelResult = await this.OrdersModel.create({
        orderStatus: 'notAccepted',
        moneyStatus: 'pending',
        clientId: userId,
        merchantId:userId2,
        amountOrder: amount,
      });

      const settingModelResult = await this.SettingModel.findByPk(1);
      if (settingModelResult) throw new NotFoundError('Setting not found');

      if (settingModelResult.activeGateway === 'safeHaven.gateway') {
        const TransactionModelResult = await this.TransactionModel.create({
          userId,
          orderId: OrderModelResult.id,
        });
        await this.loadGateWay();

        const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
          where: { userId: merchantId },
        });

        const getdeliveryAmountSummary = this.getdeliveryAmountSummary(
          MerchantAdsModelResult.pricePerThousand,
          amount,
          settingModelResult.serviceCharge,
          settingModelResult.gatewayService
        );

        /*
        const generateVirtualAccountResult =
          await this.gateway.generateVirtualAccount(
            this.validFor,
            getdeliveryAmountSummary.totalAmount,
            getdeliveryAmountSummary.callbackUrl,
            TransactionModelResult.id
          );*/
  /*
        const sessionId = `session${Date.now()}-${Math.floor(
          Math.random() * 100000
        )}`;
        const generateVirtualAccountResult = {
          bankName: 'kuda',
          accountNumber: '393939939393',
          accountName: 'chinaza ogbonna',
          sessionId,
          getdeliveryAmountSummary,
        };

        /**
         * -accountniumber
         * -sessionIdVirtualAcct
         * -orderId
         */
  /*generateVirtualAccountResult[fieldName] = newValue; // Update the specific field
          await transaction.save(); */

  /**************************************************** 
    TAKE OUT THIS SECTION IS FOR TESTING 
*****************************************************/

  /*
        const successufullPayment = {
          _id: '1212334556654',
          client: '',
          virtualAccount: {
            sessionId,
            nameEnquiryReference: '',
            paymentReference: TransactionModelResult.id,
            isReversed: true,
            reversalReference: '',
            provider: '',
            providerChannel: '',
            providerChannelCode: '',
            destinationInstitutionCode: '',
            creditAccountName: '',
            creditAccountNumber: '',
            creditBankVerificationNumber: '',
            creditKYCLevel: '',
            debitAccountName: '',
            debitAccountNumber: '',
            debitBankVerificationNumber: '',
            debitKYCLevel: '',
            transactionLocation: '',
            narration: '',
            amount: getdeliveryAmountSummary.totalAmount,
            fees: 0,
            vat: 0,
            stampDuty: 0,
            responseCode: '',
            responseMessage: '',
            status: 'PAID',
            isDeleted: true,
            createdAt: '',
            declinedAt: '',
            updatedAt: '',
            __v: 0,
          },
        };

        this.writeToDirect(successufullPayment);

        /**************************************************** 
    END OF THE SECTION
*****************************************************/

  /*
        return generateVirtualAccountResult;
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  */
  async handleGetMyOrders(data) {
    const { userId, userType, type } =
      await userUtil.verifyHandleGetMyOrders.validateAsync(data);
    console.log(userId);
    console.log(userId);
    console.log(userId);
    console.log(userId);
    console.log(userId);
    let orderResult;
    try {
      // Fetch orders based on user type and order type
      if (userType === 'client') {
        if (type === 'active') {
          orderResult = await this.OrdersModel.findAll({
            where: {
              clientId: userId,
              orderStatus: {
                [Op.or]: ['inProgress', 'pending'],
              },
            },
          });
        } else if (type === 'completed') {
          orderResult = await this.OrdersModel.findAll({
            where: {
              clientId: userId,
              orderStatus: 'completed',
            },
          });
        }
      } else if (userType === 'merchant') {
        if (type === 'active') {
          orderResult = await this.OrdersModel.findAll({
            where: {
              merchantId: userId,
              orderStatus: {
                [Op.or]: ['inProgress', 'pending'],
              },
            },
          });
        } else if (type === 'completed') {
          orderResult = await this.OrdersModel.findAll({
            where: {
              merchantId: userId,
              orderStatus: 'completed',
            },
          });
        } else if (type === 'all') {
          orderResult = await this.OrdersModel.findAll({
            where: {
              merchantId: userId,
            },
          });
        }
      }

      // Process and enrich each order
      for (const order of orderResult) {
        const clientDetails = await this.getUserDetails(order.clientId);
        const merchantDetails = await this.getUserDetails(order.merchantId);

        order.clientDetails = clientDetails;
        order.merchantDetails = merchantDetails;

        // Calculate distance
        const distance = this.calculateDistance(
          clientDetails.lat,
          clientDetails.lng,
          merchantDetails.lat,
          merchantDetails.lng
        );
        order.distance = distance;

        // Estimate delivery time (in minutes)
        const estimatedDeliveryTime =
          this.getEstimatedDeliveryTimeByFoot(distance);
        // order.estimatedDeliveryTimeByFoot = estimatedDeliveryTime;
        order.transactionTime = estimatedDeliveryTime;
      }

      console.log(orderResult);
      return orderResult;
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  // Estimate delivery time by foot (distance in kilometers)
  getEstimatedDeliveryTimeByFoot(distanceInKm) {
    const walkingSpeedKmPerHour = 5; // average walking speed
    const timeInHours = distanceInKm / walkingSpeedKmPerHour;
    const timeInMinutes = Math.round(timeInHours * 60); // convert to minutes
    return `${timeInMinutes} min`;
  }

  async handleGetChatHistory(data) {
    const { userId, userType, orderId } =
      await userUtil.verifyHandleGetChatHistory.validateAsync(data);

    const order = await this.OrdersModel.findByPk(orderId);
    //const roomId = `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}room`;
    const roomId = `${Math.min(order.clientId, order.merchantId)}-${Math.max(
      order.clientId,
      order.merchantId
    )}room`;

    let user = {};

    if (!order) throw new NotFoundError('Order not found');
    if (userType == 'client') {
      const merchant = await this.UserModel.findByPk(order.merchantId, {
        include: [
          {
            model: this.MerchantProfileModel,
            as: 'MerchantProfile',
            attributes: ['displayName', 'imageUrl'],
          },
        ],
      });

      user = {
        name: merchant.MerchantProfile.displayName,
        imageUrl: merchant.MerchantProfile.imageUrl,
        isOnline: merchant.isOnline,
        id: merchant.id,
      };
    } else {
      const client = await this.UserModel.findByPk(order.clientId);

      user = {
        name: client.firstName + ' ' + client.lastName,
        imageUrl: client.imageUrl,
        isOnline: client.isOnline,
        id: client.id,
      };
    }
    try {
      const getMessagesByRoomResult = await this.getMessagesByRoom(roomId);
      return {
        chat: getMessagesByRoomResult,
        user,
        order: {
          clientId: order.clientId,
          merchantId: order.merchantId,
        },
      };
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleSetMerchantAccountStatus(data) {
    const { userId, accountStatus } =
      await userUtil.verifyHandleSetMerchantAccountStatus.validateAsync(data);
    try {
      const MerchantProfileModelResult =
        await this.MerchantProfileModel.findOne({ where: { userId } });
      console.log(MerchantProfileModelResult);
      MerchantProfileModelResult.update({ accountStatus });
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetProfileInformation(data) {
    const { userId } =
      await userUtil.verifyHandleGetProfileInformation.validateAsync(data);
    try {
      const UserModelResult = await this.UserModel.findByPk(userId);
      const MerchantProfileModelResult =
        await this.MerchantProfileModel.findOne({ where: { userId } });

      return {
        UserModelResult,
        MerchantProfileModelResult,
      };
    } catch (error) {
      console.log(error);
      //throw new SystemError(error.name, error?.response?.data?.error);
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetMyRangeLimit(data) {
    const { userId } = await userUtil.verifyHandleGetMyRangeLimit.validateAsync(
      data
    );
    try {
      const SettingModelResult = await this.SettingModel.findByPk(1);
      const MerchantProfileModelResult =
        await this.MerchantProfileModel.findOne({
          where: { userId },
        });

      const SettingModelResultTiers = JSON.parse(SettingModelResult.tiers);

      for (let index = 0; index < SettingModelResultTiers.length; index++) {
        const element = SettingModelResultTiers[index];

        if (element.uniqueNumber === MerchantProfileModelResult.accountTier) {
          return { maxAmount: element.maxAmount, minAmount: 1000 }; //element.maxAmount;
        }
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleGetMerchantInformation(data) {
    const { userId, userId2 } =
      await userUtil.verifyHandleGetMerchantInformation.validateAsync(data);
    try {
      const MerchantProfileModelResult =
        await this.MerchantProfileModel.findOne({
          where: { userId: userId2 },
        });
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId: userId2 },
      });

      if (!MerchantProfileModelResult) {
        throw new NotFoundError('Merchant profile not found');
      }
      return {
        ...MerchantProfileModelResult.dataValues,
        ...MerchantAdsModelResult.dataValues,
      };
    } catch (error) {
      console.log(error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleCreateMerchantAds(data) {
    const { minAmount, maxAmount, pricePerThousand, userId } =
      await userUtil.verifyHandleCreateMerchantAds.validateAsync(data);
    const SettingModelResult = await this.SettingModel.findByPk(1);
    const MerchantProfileModelResult = await this.MerchantProfileModel.findOne({
      where: { userId },
    });

    if (minAmount > maxAmount)
      throw new BadRequestError(
        'Minimum amount cannot be greater than maximum amount'
      );
    if (!MerchantProfileModelResult)
      throw new NotFoundError('Merchant profile not found');

    const SettingModelResultTiers = JSON.parse(SettingModelResult.tiers);

    console.log(SettingModelResultTiers);
    //making sure merchant dont set price above there tier
    for (let index = 0; index < SettingModelResultTiers.length; index++) {
      const element = SettingModelResultTiers[index];

      if (element.uniqueNumber === MerchantProfileModelResult.accountTier) {
        if (maxAmount <= element.maxAmount) {
          break;
        } else {
          throw new ConflictError(
            `You need to upgrade your account. Your account tier allows you to set a maximum amount of ${element.maxAmount}`
          );
        }
      }
    }
    try {
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId },
      });
      if (MerchantAdsModelResult) {
        MerchantAdsModelResult.update({
          minAmount,
          maxAmount,
          pricePerThousand,
        });
      } else {
        await this.MerchantAdsModel.create({
          minAmount,
          maxAmount,
          userId,
          pricePerThousand,
        });
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  async makeMatch() {
    const setting = await this.SettingModel.findByPk(1);

    /*
    try {
      // //Check if match process is running
      console.log('Running every 10 seconds');
      console.log(setting.isMatchRunning);
      if (setting.isMatchRunning) return;

      setting.isMatchRunning = true;
      setting.save();
      let distanceThreshold = setting.distanceThreshold || 10; // Example threshold in kilometers

      // Fetch users
      const users = await this.UserModel.findAll({
        attributes: ['id', 'lat', 'lng'],
        where: { isEmailValid: true },
      });

      // Fetch merchants with active profiles
      const merchants = await this.UserModel.findAll({
        attributes: ['id', 'lat', 'lng'],
        where: {
          isEmailValid: true,
          merchantActivated: true,
        },
        include: [
          {
            model: MerchantProfile,
            as: 'MerchantProfile',
            attributes: ['deliveryRange'], // No extra data needed
            where: { accountStatus: 'active' },
            required: true,
          },
        ],
      });

      const userMatchesMap = new Map();

      // Pre-fetch existing matches in one query to avoid multiple DB calls
      const existingMatches = await this.MymatchModel.findAll({
        where: { userId: users.map((u) => u.id) },
      });

      // Convert fetched data into a map for faster lookup
      const existingMatchesMap = new Map(
        existingMatches.map((match) => [match.userId, match])
      );

      for (const user of users) {
        const userMatches = [];

        for (const merchant of merchants) {
          if (user.id === merchant.id) continue; // Avoid matching user to themselves

          if (merchant.deliveryRange) {
            distanceThreshold = Math.max(
              merchant.deliveryRange,
              distanceThreshold
            );
          }

          const distance = this.calculateDistance(
            Number(user.lat),
            Number(user.lng),
            Number(merchant.lat),
            Number(merchant.lng)
          );

          if (distance <= distanceThreshold) {
            userMatches.push({ merchantId: merchant.id, distance });
          }
        }

        userMatchesMap.set(user.id, userMatches);
      }

      // Prepare bulk insert/update arrays
      const toInsert = [];
      const toUpdate = [];

      for (const [userId, matches] of userMatchesMap.entries()) {
        const existingMatch = existingMatchesMap.get(userId);

        if (existingMatch) {
          toUpdate.push({ id: existingMatch.id, matches });
        } else {
          toInsert.push({ userId, matches });
        }
      }

      // Perform bulk insert
      if (toInsert.length > 0) {
        await this.MymatchModel.bulkCreate(toInsert);
      }

      // Perform bulk update
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((entry) =>
            this.MymatchModel.update(
              { matches: entry.matches },
              { where: { id: entry.id } }
            )
          )
        );
      }

      setting.isMatchRunning = false;
      setting.save();
      console.log('User-Merchant matching completed.');
    } catch (error) {
      console.error('Error during matching:', error);

      setting.isMatchRunning = false;
      setting.save();
      console.log();
      throw new SystemError(error.name, error?.response?.data?.error);
    } finally {
      setting.isMatchRunning = false;
      setting.save();
    }*/
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers

    const value =
      EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const rounded = Math.floor(value * 100) / 100;
    return rounded;
  }

  async getActiveGateway() {
    const Setting = await this.SettingModel.findByPk(1);
    return Setting.activeGateway;
  }

  async getMessagesByRoom(roomId) {
    return await this.ChatModel.findAll({
      where: { roomId },
      order: [['createdAt', 'ASC']],
    });
  }

  async saveMessage(userId1, userId2, roomId, messageType, content) {
    return await this.ChatModel.create({
      userId1,
      userId2,
      roomId,
      messageType,
      message: content,
    });
  }
  async markMessageAsDelivered(messageId) {
    try {
      const message = await this.ChatModel.findByPk(messageId);
      if (message && message.messageStatus === 'sent') {
        message.messageStatus = 'delivered';
        message.deliveredAt = new Date();
        await message.save();
        return message;
      }
      return message;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw error;
    }
  }

  async markMessagesAsDelivered(roomId, userId) {
    try {
      await this.ChatModel.update(
        {
          messageStatus: 'delivered',
          deliveredAt: new Date(),
        },
        {
          where: {
            roomId: roomId,
            userId1: { [Op.ne]: userId }, // Messages not sent by this user
            messageStatus: 'sent',
          },
        }
      );
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
      throw error;
    }
  }

  // Mark all delivered messages from other users as read for a specific user
  async markMessagesAsRead(roomId, userId) {
    try {
      const updatedMessages = await Chat.update(
        {
          messageStatus: 'read',
          readAt: new Date(),
        },
        {
          where: {
            roomId: roomId,
            userId1: { [Op.ne]: userId }, // Messages not sent by this user
            messageStatus: ['delivered', 'sent'],
          },
          returning: true, // Return updated records
        }
      );
      return updatedMessages;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async updateTransactionSaveHaven(sessionIdVirtualAcct) {
    const TransactionModelResult = await this.TransactionModel.findOne({
      sessionIdVirtualAcct,
    });
    if (!this.gateway) {
      await this.loadGateWay();
    }

    if (TransactionModelResult) {
      /*
      const transactionStatus =
        await this.gateway.getVirtualAccountTransferStatus(
          sessionIdVirtualAcct
        );*/
    }
  }
  async updateOrder(orderId, data) {
    try {
      const orderResult = await this.OrdersModel.findByPk(orderId);
      if (!orderResult) return;
      //orderResult.update(data);
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  clientTransactionUpdateSocket(roomId, data) {
    const io = getSocketInstance();
    io.to(roomId).emit('transactionUpdate', {
      data,
    });
  }
  clientTransactionUpdatePushNofication(fcmToken, data) {
    this.sendToDevice(fcmToken, data);
  }
  async getOrCreateRoom(userId, merchantId) {
    let room = await this.ChatModel.findOne({ where: { userId, merchantId } });
    if (!room) {
      room = await this.ChatModel.create({ userId, merchantId });
    }
    return room;
  }

  async getQRCodeHash(clientId, merchantId, passwordHash, orderId) {
    //passwordHash for the user;
    /*  const convertToHash =
      clientId + merchantId + passwordHash + serverConfig.GET_QR_CODE_HASH;
*/
    const convertToHash = this.rawOrderHash(
      clientId,
      merchantId,
      passwordHash,
      orderId
    );

    let myHash;

    try {
      myHash = await bcrypt.hash(
        convertToHash,
        Number(serverConfig.SALT_ROUNDS)
      );
    } catch (error) {
      console.log(error);
      throw new SystemError(error);
    }
    return myHash;
  }
  async getUserDetails(userId) {
    return await this.UserModel.findOne({ where: { id: userId } });
  }

  async howmanyActiveOrder(userId) {
    try {
      const orderCount = await this.OrdersModel.count({
        where: {
          merchantId: userId,
          orderStatus: 'inProgress',
        },
      });
      return orderCount;
    } catch (error) {
      console.error('Error fetching active orders:', error);
      throw error; // Re-throw the error after logging it
    }
  }

  async generateRandomPassword(length = 12) {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }

    return password;
  }
  async getRouteSummary(fromLat, fromLng, toLat, toLng) {
    try {
      const response = await axios.post(
        serverConfig.GEO_BASE_URL,
        {
          coordinates: [
            [fromLat, fromLng],
            [toLat, toLng],
          ],
          //radiuses: [1000, 1000],
        },
        {
          headers: {
            Authorization: serverConfig.GEO_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      // console.log(response.data);
      if (response.data && response.data.routes.length > 0) {
        const route = response.data.routes[0]; // Get the first route
        const details = {
          distance: route.summary.distance, // Distance in meters
          duration: route.summary.duration, // Duration in seconds
          waypoints: route.geometry, // Encoded polyline for route geometry
          bbox: route.bbox, // Bounding box of the route
        };
        console.log('Route details:', details);
      } else {
        throw new Error('No route found.');
      }
    } catch (error) {
      console.error('Error calculating route:', error.message);
      throw error;
    }
  }
  async updateWallet(userId, amount) {
    const t = await db.sequelize.transaction();

    try {
      // Lock the row to avoid race conditions
      const user = await this.UserModel.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Initialize or sanitize walletBalance
      let wallet = user.walletBalance;

      if (typeof wallet === 'string') {
        try {
          wallet = JSON.parse(wallet);
        } catch (e) {
          console.warn('Invalid JSON wallet:', wallet);
          wallet = null;
        }
      }

      // If wallet is still null or not an object, default it
      if (!wallet || typeof wallet !== 'object') {
        console.log('Setting default wallet');
        wallet = { previous: 0, current: 0 };
      }

      // Defensive fallback in case of invalid structure
      const previous = parseFloat(wallet.current ?? wallet.previous ?? 0);
      const newCurrent = previous + parseFloat(amount);

      const updatedWallet = {
        previous,
        current: newCurrent,
      };

      await user.update({ walletBalance: updatedWallet }, { transaction: t });
      await t.commit();

      return updatedWallet;
    } catch (err) {
      await t.rollback();
      console.error('Failed to update wallet:', err);
      throw err;
    }
  }

  async updateAdminWallet(userId, amount) {
    const t = await db.sequelize.transaction();

    try {
      // Lock row FOR UPDATE to avoid race conditions
      const setting = await this.SettingModel.findByPk(userId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!setting) {
        throw new Error('Admin not found');
      }

      // Handle possible stringified JSON
      let wallet = setting.walletBalance;
      if (typeof wallet === 'string') {
        wallet = JSON.parse(wallet);
      }

      wallet.previous = wallet.current || 0;
      wallet.current = parseFloat(wallet.previous) + parseFloat(amount);

      // Save the updated JSON
      await setting.update({ walletBalance: wallet }, { transaction: t });

      await t.commit();
      return wallet;
    } catch (error) {
      await t.rollback();
      console.error('Error updating admin wallet:', error);
      throw error;
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
        Number(amount) +
        Number(closestMerchantAmount.charge) +
        Number(closestServiceCharge.charge) +
        Number(closestGatewayCharge.charge);

      return {
        totalAmount: totalAmountToPay, // Total amount to be paid
        merchantCharge: closestMerchantAmount.charge, // Merchant charge
        serviceCharge: closestServiceCharge.charge, // Service charge
        gatewayCharge: closestGatewayCharge.charge, // Gateway charge
        amountOrder: Number(amount), // Amount to be ordered
      };
    } else {
      throw new Error('No valid charge found for the given amount');
    }
  }

  async getAmountOrderFromTotal(
    totalAmount,
    merchantads,
    serviceCharge,
    gatewayService
  ) {
    // Sort all arrays by amount
    merchantads.sort((a, b) => a.amount - b.amount);
    serviceCharge.sort((a, b) => a.amount - b.amount);
    gatewayService.sort((a, b) => a.amount - b.amount);

    // Try possible amountOrder values and find the one that results in the given totalAmount
    for (let amount = 1; amount <= totalAmount; amount++) {
      let closestMerchant = null;
      let closestService = null;
      let closestGateway = null;

      for (let i = 0; i < merchantads.length; i++) {
        if (merchantads[i].amount <= amount) {
          closestMerchant = merchantads[i];
        } else {
          break;
        }
      }

      for (let i = 0; i < serviceCharge.length; i++) {
        if (serviceCharge[i].amount <= amount) {
          closestService = serviceCharge[i];
        } else {
          break;
        }
      }

      for (let i = 0; i < gatewayService.length; i++) {
        if (gatewayService[i].amount <= amount) {
          closestGateway = gatewayService[i];
        } else {
          break;
        }
      }

      if (closestMerchant && closestService && closestGateway) {
        const computedTotal =
          amount +
          closestMerchant.charge +
          closestService.charge +
          closestGateway.charge;

        if (computedTotal === totalAmount) {
          return {
            amountOrder: amount,
            merchantCharge: closestMerchant.charge,
            serviceCharge: closestService.charge,
            gatewayCharge: closestGateway.charge,
            totalAmount: computedTotal,
          };
        }
      }
    }

    // If no match found
    throw new Error('No matching amountOrder found for the given totalAmount');
  }

  async writeToDirect() {
    try {
      const filePath = path.join(process.cwd(), 'data', 'data.json');
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }

      let existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const updatedData = [...existingData, ...newData];
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    } catch (error) {
      console.log(error);
    }
  }

  async sendEmailCredential(emailAddress, password, firstName) {
    try {
      try {
        await mailService.sendMail({
          to: emailAddress,
          subject: 'login credential',
          templateName: 'sendAdminCredential',
          variables: {
            admin_email: emailAddress,
            admin_password: password,
            admin_name: firstName,
            // admin_link: serverConfig.CLIENT_URL,
          },
        });
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  }
  convertToJson = (data) => {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      } else if (typeof data === 'object') {
        return data;
      }
    } catch (error) {
      console.error('Error converting to JSON:', error);
    }
  };
  async updateClientWallet(userId, amount) {
    // Create transaction
    await this.TransactionModel.create({
      userId,
      amount,
      transactionId: this.generateOrderId('NG_TX', 10),
      transactionType: 'fundWallet',
      paymentStatus: 'successful',
      transactionFrom: 'wallet',
    });

    // Fetch user with await
    const user = await this.UserModel.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    try {
      // Safely parse wallet balance
      let walletBalance = this.convertToJson(user.walletBalance);
      if (!walletBalance) {
        walletBalance = { previous: 0, current: 0 };
      }

      // Update balance
      walletBalance.previous = walletBalance.current;
      walletBalance.current += parseFloat(amount);

      // Persist updated balance
      await user.update({ walletBalance });
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async refundOrderTransaction(OrdersModelResult, orderStatus, reason = '') {
    await OrdersModelResult.update({ orderStatus, reason });

    await OrdersModelResult.update({ moneyStatus: 'refund' });
    const settingResult = await this.SettingModel.findByPk(1);
    if (settingResult) {
      new NotFoundError('Settings not found');
    }

    try {
      /*
      const merchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId: OrdersModelResult.merchantId },
      });
      const priceData = this.convertToJson(
        merchantAdsModelResult.pricePerThousand
      );
      const serviceCharge = this.convertToJson(settingResult.serviceCharge);
      const gatewayService = this.convertToJson(settingResult.gatewayService);

      const amountSummary = await this.getdeliveryAmountSummary(
        priceData,
        OrdersModelResult.amountOrder,
        serviceCharge,
        gatewayService
      );

      const amount =
        amountSummary.amountOrder +
        amountSummary.merchantCharge +
        amountSummary.serviceCharge;*/
      await this.updateClientWallet(
        OrdersModelResult.clientId,
        OrdersModelResult.totalAmount
      );
    } catch (error) {
      new SystemError(error);
    }

    try {
      await this.sendToDevice(
        userResult.fcmToken, // Assuming `userResult` is the customer
        {
          title: 'Order Rejected ❌',
          body: `Your order was rejected. Please try another merchant. The amount has been refunded to your wallet.`,
        },
        {
          type: 'ORDER_REJECTED',
          orderId: rejectedOrder.orderId, // Replace with your actual order object
        }
      );
    } catch (error) {
      console.error('Error updating client wallet:', error);
    }
    /* })
          .catch((error) => {
            console.error('Update failed:', error);
          });*/
  }
  rawOrderHash(clientId, merchantId, userPassword, orderId) {
    const unConvertedHash =
      clientId +
      merchantId +
      userPassword +
      orderId +
      serverConfig.GET_QR_CODE_HASH;

    return unConvertedHash;
  }
  async startTestPush() {
    /*
    const sendTestNotification = async () => {
      try {
        console.log(`Starting test push notifications for user ID: ${userId}`);
        console.log(`Starting test push notifications for user ID: ${userId}`);
        console.log(`Starting test push notifications for user ID: ${userId}`);

        console.log(`Starting test push notifications for user ID: ${userId}`);
        // Get user info (adjust to your ORM or DB logic)
        const user = await User.findByPk(userId);
        if (!user || !user.fcmToken) {
          console.log(`User with ID ${userId} not found or missing FCM token.`);
          return;
        }

        console.log(`User found: ${userId}, FCM Token: ${user.fcmToken}`);
        // Send notification
        await this.sendToDevice(
          user.fcmToken,
          {
            title: '🔁 Test Notification',
            body: 'This is a recurring test push notification.',
          },
          {
            type: 'TEST_NOTIFICATION',
            timestamp: Date.now(),
          }
        );

        console.log(`Test notification  to user ${userId}`);
      } catch (err) {
        console.error('Error sending test push:', err.message);
        console.error('Error sending test push:', err.message);
        console.error('Error sending test push:', err.message);
        console.error('Error sending test push:', err.message);
        console.error('Error sending test push:', err.message);
        console.error('Error sending test push:', err.message);
      }
    };

    // Call immediately and then every 19 seconds
    sendTestNotification(); // First call
    setInterval(sendTestNotification, 19000); // Every 19s
    */
  }
}

/**const merchantads = [
    { amount: 1000, charge: 100 },
    { amount: 5000, charge: 300 },
    { amount: 7000, charge: 500 },
]; */
/*
const test = new UserService();
test.writeToDirect();*/

export default new UserService();
