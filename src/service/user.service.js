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
} from '../db/models/index.js';
import userUtil from '../utils/user.util.js';
import authService from '../service/auth.service.js';
import bcrypt from 'bcrypt';
import serverConfig from '../config/server.js';
import { Op, Sequelize, where } from 'sequelize';
import mailService from '../service/mail.service.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, format } from 'date-fns';
import { fn, col, literal } from 'sequelize';
import axios from 'axios';
import { loadActiveGateway } from '../utils/gatewayLoader.js';
import { getSocketInstance } from '../utils/socketUtils.js';
import { sendPushNotification } from '../service/push.service.js';

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

  async handleVerifyNIN(data) {
    var { NIN, userId, role } =
      await userUtil.validateHandleValidateNIN.validateAsync(data);

    const accessToken = await authService.getAuthTokenMonify();
    const body = {
      nin: NIN,
    };

    try {
      const response = await axios.post(
        `${serverConfig.MONNIFY_BASE_URL}/api/v1/vas/nin-details`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // const phone = response.data.responseBody.mobileNumber;

      // authService.sendNINVerificationCode(phone, userId, role)
    } catch (error) {
      console.log(error?.response?.data);
      throw new SystemError(error.name, error?.response?.data?.error);
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

    if (!(await bcrypt.compare(myPassCode, userResult.passCode))) return null;

    if (userResult.disableAccount) return 'disabled';

    return userResult;
  }

  async handleGetMyMerchant(data) {
    const { userId, distance, range } =
      await userUtil.verifyHandleGetMyMerchant.validateAsync(data);

    try {
      const MymatchModel = await this.MymatchModel.findOne({
        userId: userId,
      });

      if (MymatchModel) {
        let matches = matchData.matches;

        if (typeof matches === 'string') {
          matches = JSON.parse(matches);
        }

        const filteredMatches = [];

        for (let i = 0; i < matches.length; i++) {
          let merchant = await this.UserModel.findOne({
            where: { id: matches[i].merchantId, disableAccount: false },
            include: [
              {
                model: MerchantProfile,
                as: 'MerchantProfile',
                attributes: ['displayname'],
                where: {
                  accountStatus: 'active',
                },
              },
              {
                model: this.MerchantAdsModel,
                as: 'UserMerchantAds',
                attributes: [
                  'minAmount',
                  'maxAmount',
                  'deliveryRange',
                  'pricePerThousand',
                ],
                required: true,
              },
            ],
            attributes: ['tel', 'isOnline'],
          });

          let OrdersModelResult = await this.OrdersModel.count({
            where: {
              isDeleted: false,
              merchantId: userId,
              hasIssues: false,
            },
          });

          // Add distance to merchant
          merchant.distance = matches[i].distance;
          merchant.numberOfOrder = OrdersModelResult;
          // Apply filters
          /* const isWithinAccuracy = accuracy
            ? matches[i].accuracy <= accuracy
            : true;*/
          const isWithinDistance = distance
            ? matches[i].distance <= distance
            : true;
          const isWithinRange = range
            ? merchant.UserMerchantAds.some((ad) => ad.deliveryRange <= range)
            : true;

          if (isWithinDistance && isWithinRange) {
            filteredMatches.push(merchant);
          }
        }

        return filteredMatches;
      } else {
        return [];
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
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
        accoutTier: 1,
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
  async handleGetMyOrderDetails(data) {
    const { orderId, type, userId } =
      await userUtil.verifyHandleGetMyOrderDetails.validateAsync(data);
    try {
      const orderResult = await this.OrdersModel.findByPk(orderId);
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

      return {
        Balance: UserModelResult.walletBalance,
        EscrowBalance: totalMerchantCharge,
        SuccessFullCount,
        PendingCount,
        CancellCount,
      };
    } catch (error) {
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
  async handleGetUsers(data) {
    const { type } = await userUtil.verifyHandleGetUsers.validateAsync(data);

    try {
      if (type === 'client') {
        return await this.UserModel.findAll({
          attributes: {
            exclude: [
              'password',
              'refreshToken',
              'ipAdress',
              'tel',
              'bankCode',
            ],
          },
        });
      } else if (type === 'merchant') {
        return await this.UserModel.findAll({
          where: { merchantActivated: true },
          attributes: {
            exclude: [
              'password',
              'refreshToken',
              'ipAdress',
              'tel',
              'bankCode',
            ],
          },
        });
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
      return {
        numberOfUser: userResult,
        numberOfMerchant: userMerchantResult,
        balance: settingModelResult.walletBalance,
        EscrowBalance: totalServiceCharge,
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
      MerchantAdsModelResult.pricePerThousand = JSON.parse(
        MerchantAdsModelResult.pricePerThousand
      );
      return MerchantAdsModelResult;
    } catch (error) {
      console.error('Error fetching default with details:', error);
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleGetdefaultAds() {
    try {
      const settingModelResult = await this.SettingModel.findByPk(1);
      const settingModelResultPared = JSON.parse(settingModelResult.defaultAds);
      return settingModelResultPared;
    } catch (error) {
      console.error('Error fetching default with details:', error);
      throw new SystemError(error.name, error.parent);
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
      console.log('transactions');

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

  async handleGenerateAccountVirtual(data) {
    const { amount, userId, merchantId } =
      await userUtil.verifyHandleGenerateAccountVirtual.validateAsync(data);
    try {
      const OrderModelResult = await this.OrdersModel.create({
        userId,
        orderStatus: 'notAccepted',
        moneyStatus: 'pending',
        clientId: userId,
        merchantId,
        amountOrder: amount,
      });
      const TransactionModelResult = await this.TransactionModel.create({
        userId,
        orderId: OrderModelResult.id,
      });
      await this.loadGateWay();
      const MerchantAdsModelResult = await this.MerchantAdsModel.findOne({
        where: { userId: merchantId },
      });
      const settingResult = await this.SettingModel.findByPk(1);
      const getdeliveryAmountSummary = this.getdeliveryAmountSummary(
        MerchantAdsModelResult.pricePerThousand,
        amount,
        settingResult.serviceCharge,
        settingResult.gatewayService
      );
      const generateVirtualAccountResult =
        await this.gateway.generateVirtualAccount(
          this.validFor,
          getdeliveryAmountSummary.totalAmount,
          getdeliveryAmountSummary.callbackUrl,
          TransactionModelResult.id
        );
      /**
       * -accountniumber
       * -sessionIdVirtualAcct
       * -orderId
       */
      /*generateVirtualAccountResult[fieldName] = newValue; // Update the specific field
        await transaction.save(); */
      return generateVirtualAccountResult;
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
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

        if (element.uniqueNumber === MerchantProfileModelResult.accoutTier) {
          return element.maxAmount;
        }
      }
    } catch (error) {
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

    const SettingModelResultTiers = JSON.parse(SettingModelResult.tiers);

    //making sure merchant dont set price above there tier
    for (let index = 0; index < SettingModelResultTiers.length; index++) {
      const element = SettingModelResultTiers[index];

      if (element.uniqueNumber === MerchantProfileModelResult.accoutTier) {
        if (maxAmount <= element.maxAmount) {
          break;
        } else {
          throw new ConflictError('You need to upgrade your account.');
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
    try {
      // Check if match process is running
      const setting = await this.SettingModel.findByPk(1);
      if (setting.isMatchRunning) return;
      setting.isMatchRunning = true;
      setting.save();
      let distanceThreshold = setting.distanceThreshold || 10; // Example threshold in kilometers

      // Fetch users
      const users = await this.UserModel.findAll({
        attributes: ['id', 'lat', 'lng'],
      });

      // Fetch merchants with active profiles
      const merchants = await this.UserModel.findAll({
        attributes: ['id', 'lat', 'lng'],
        where: { merchantActivated: true },
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

      // Match users with merchants
      for (const user of users) {
        const userMatches = [];

        for (const merchant of merchants) {
          distanceThreshold =
            merchant.deliveryRange > distanceThreshold
              ? merchant.deliveryRange
              : distanceThreshold;

          const distance = this.calculateDistance(
            user.lat,
            user.lng,
            merchant.lat,
            merchant.lng
          );

          if (distance <= distanceThreshold) {
            userMatches.push({ merchantId: merchant.id, distance });
          }
        }

        await this.MymatchModel.upsert({
          userId: user.id,
          matches: userMatches,
        });
      }
      setting.isMatchRunning = false;
      setting.save();
      console.log('User-Merchant matching completed.');
    } catch (error) {
      console.error('Error during matching:', error);
      throw new SystemError(error.name, error?.response?.data?.error);
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
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  async updateTransaction(sessionIdVirtualAcct) {
    const TransactionModelResult = await this.TransactionModel.findOne({
      sessionIdVirtualAcct,
    });
    if (!this.gateway) {
      await this.loadGateWay();
    }
    if (TransactionModelResult) {
      const transactionStatus =
        await this.gateway.getVirtualAccountTransferStatus(
          sessionIdVirtualAcct
        );
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
        totalAmount: totalAmountToPay,
        merchantCharge: closestMerchantAmount.charge,
        serviceCharge: closestServiceCharge.charge,
        gatewayCharge: closestGatewayCharge.charge,
      };
    } else {
      throw new Error('No valid charge found for the given amount');
    }
  }
}
/**const merchantads = [
    { amount: 1000, charge: 100 },
    { amount: 5000, charge: 300 },
    { amount: 7000, charge: 500 },
]; */
export default new UserService();
