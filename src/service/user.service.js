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
import { sendPushNotification } from '../service/push.service.js';
import fs from 'fs';
import path from 'path';

import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  SystemError,
} from '../errors/index.js';

class UserService {
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
  async handleOrderAcceptOrCancel(data) {
    const { orderId, userId, type } =
      await userUtil.verifyHandleOrderAcceptOrCancel.validateAsync(data);
    try {
      const OrdersModelResult = await this.OrdersModel.findByPk(orderId);
      if (!OrdersModelResult) throw new NotFoundError('Order not found');
      if (type === 'cancel') {
        if (OrdersModelResult.orderStatus === 'notAccepted') {
          OrdersModelResult.update({ orderStatus: 'cancelled' });
        }
      } else if (type === 'accept') {
        if (OrdersModelResult.orderStatus === 'notAccepted') {
          OrdersModelResult.update({ orderStatus: 'inProgress' });
        }
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
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
    const { orderId, type, userId } =
      await userUtil.verifyHandleGetMyOrderDetails.validateAsync(data);

    const orderResult = await this.OrdersModel.findByPk(orderId);

    if (!orderResult) throw new NotFoundError('Order not found');

    try {
      const merchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { UserId: orderResult.merchantId },
      });
      const userResult = await this.UserModel.findByPk(orderResult.clientId);
      const merchantResult = await this.UserModel.findByPk(
        orderResult.merchantId
      );
      const settingResult = await this.SettingModel.findByPk(1);
      const AmountSummary = this.getdeliveryAmountSummary(
        merchantAdsModelResult.pricePerThousand,
        orderResult.amountOrder,
        settingResult.serviceCharge,
        settingResult.gatewayService
      );
      if (type === 'client') {
        return {
          orderDetails: {
            orderId: orderResult.id,
            distance: orderResult.distance,
            charges: AmountSummary,
            qrCodeHash: orderResult.qrCodeHash,
            merchantDetails: {
              displayname: merchantResult.displayname,
              tel: merchantResult.tel,
              image: merchantResult.image,
              merchantAds: merchantAdsModelResult,
            },
          },
        };
      } else if (type === 'merchant') {
        return {
          orderDetails: {
            orderId: orderResult.id,
            distance: orderResult.distance,
            amount: orderResult.amount,
            clientDetails: {
              displayname: userResult.displayname,
              tel: userResult.tel,
              image: userResult.image,
            },
          },
        };
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetOrderStatistic(data) {
    const { userId } =
      await userUtil.verifyHandleGetOrderStatistic.validateAsync(data);
    try {
      const UserModelResult = await this.UserModel.findByPk(userId);
      const SuccessFullCount = await this.OrdersModel.count({
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
      for (let order of OrdersModelResult) {
        const amountSummary = this.getdeliveryAmountSummary(
          merchantAdsModelResult.pricePerThousand,
          order.amountOrder,
          settingResult.serviceCharge,
          settingResult.gatewayService
        );
        totalMerchantCharge += amountSummary.merchantCharge;
      }

      const balance = JSON.parse(UserModelResult.walletBalance).current;
      return {
        Balance: balance,
        EscrowBalance: totalMerchantCharge,
        SuccessFullCount,
        PendingCount,
        CancellCount,
      };
    } catch (error) {
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
        walletBalance: JSON.parse(user.walletBalance).current,
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
          id: txn.id,
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
      await userUtil.verifyHandleOrderAcceptOrCancel.validateAsync(data);
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
          dateFilter,
          transactionType: 'order',
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
  async handleverifyCompleteOrder(data) {
    const { userId, orderId, hash } =
      await userUtil.verifyHandleOrderAcceptOrCancel.validateAsync(data);

    try {
      /*-------------------------------
      the first part is use to validate 
      that the person accessing this route
      is the right person
      ---------------------------------*/
      const orderResult = await this.OrdersModel.findByPk(orderId);
      const userResult = await this.UserModel.findByPk(orderResult.clientId);

      const unConvertedHash =
        orderId +
        orderResult.clientId +
        userId +
        userResult.password +
        serverConfig.GET_QR_CODE_HASH;
      //const orderResult = await this.OrdersModel.findByPk(orderId);
      if (!(await bcrypt.compare(unConvertedHash, hash))) return null;

      orderResult.update({ orderStatus: 'completed', moneyStatus: 'paid' });

      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: {
          userId: orderResult.merchantId,
        },
      });
      const settingResult = await this.SettingModel.findByPk(1);

      const getdeliveryAmountSummary = await this.getdeliveryAmountSummary(
        MerchantAdsModelResult.pricePerThousand,
        orderResult.amountOrder,
        settingResult.serviceCharge,
        settingResult.gatewayService
      );
      this.updateWallet(userId, getdeliveryAmountSummary.merchantCharge);
      this.updateAdminWallet(1);
    } catch (error) {
      throw new SystemError(error.name, error.parent);
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

  async handleMakeOrderPayment(data) {
    const { userId, userId2, amount } =
      await userUtil.verifyHandleMakeOrderPayment.validateAsync(data);

    const userResult = await this.UserModel.findByPk(userId);
    console.log(userResult.walletBalance.current);
    if (userResult.walletBalance.current >= amount) {
      throw new BadRequestError('Insufficient balance');
    }
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

      const TransactionModelResult = await this.TransactionModel.create({
        userId,
        amount,
        transactionType: 'order',
        paymentStatus: 'successful',
        transactionFrom: 'wallet',
      });

      const OrderModelResult = await this.OrdersModel.create({
        orderStatus: 'notAccepted',
        moneyStatus: 'received',
        clientId: userId,
        merchantId: userId2,
        amountOrder: amount,
        transactionId: TransactionModelResult.id,
        totalAmount: getdeliveryAmountSummary.totalAmount,
        amountOrder: amount,
      });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
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
      console.log('settingModelResult.activeGateway');
      console.log(settingModelResult?.activeGateway);
      console.log('settingModelResult.activeGateway');
      if (settingModelResult.activeGateway === 'safeHaven.gateway') {
        if (type == 'fundWallet') {
          const sessionIdVirtualAcct = `session${Date.now()}-${Math.floor(
            Math.random() * 100000
          )}`;

          const transactionModelResult = await this.TransactionModel.create({
            userId,
            amount,
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

          const transactionModelResult = await this.TransactionModel.create({
            userId,
            amount,
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
    let orderResult = [];
    try {
      // Fetch orders based on user type and order type
      if (userType === 'client') {
        if (type === 'active') {
          orderResult = await this.OrdersModel.findAll({
            where: {
              clientId: userId,
              orderStatus: {
                [Op.or]: ['inProgress', 'notAccepted'],
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
                [Op.or]: ['inProgress', 'notAccepted'], // Sequelize OR condition
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
        }
      }

      // Add distance and transaction time details
      for (const order of orderResult) {
        const clientDetails = await this.getUserDetails(order.clientId);
        const merchantDetails = await this.getUserDetails(order.merchantId);

        order.clientDetails = clientDetails;
        order.merchantDetails = merchantDetails;

        // Calculate distance
        const distance = this.calculateDistance(
          clientDetails.lat,
          clientDetails.lng,
          clientDetails.lat,
          merchantDetails.lng
        );
        order.distance = distance;

        // Fetch transaction time
        const transactionTime = await Utility.getTransactionTime();
        order.transactionTime = transactionTime;
      }

      return orderResult;
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetChatHistory(data) {
    const { userId, roomId } =
      await userUtil.verifyHandleGetChatHistory.validateAsync(data);

    try {
      const getMessagesByRoomResult = this.getMessagesByRoom(roomId);
      return getMessagesByRoomResult;
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
      throw new SystemError(error.name, error?.response?.data?.error);
    } finally {
      setting.isMatchRunning = false;
      setting.save();
    }
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
      content,
    });
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
    sendPushNotification(fcmToken, data);
  }
  async getOrCreateRoom(userId, merchantId) {
    let room = await this.ChatModel.findOne({ where: { userId, merchantId } });
    if (!room) {
      room = await this.ChatModel.create({ userId, merchantId });
    }
    return room;
  }

  async getQRCodeHash(orderId, clientId, merchantId, passwordHash) {
    //passwordHash for the user;
    const convertToHash =
      orderId +
      clientId +
      merchantId +
      passwordHash +
      serverConfig.GET_QR_CODE_HASH;
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
    const UserModelResult = await this.UserModel.findByPk(userId);
    let walletBalance =
      parseFloat(UserModelResult.walletBalance) + parseFloat(amount);
    UserModelResult.update({ walletBalance });
  }
  async updateAdminWallet(userId, amount) {
    const SettingModelResult = await this.SettingModel.findByPk(userId);
    let walletBalance =
      parseFloat(SettingModelResult.walletBalance) + parseFloat(amount);
    SettingModelResult.update({ walletBalance });
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
