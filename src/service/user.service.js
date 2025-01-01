import {
  User,
  EmailandTelValidation,
  Setting,
  Mymatch,
  MerchantProfile,
  MerchantAds,
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

  async handleUpdatePin(data, file) {
    let { userId, role, image, ...updateData } =
      await userUtil.verifyHandleUpdatePin.validateAsync(data);
    try {
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleUpdateProfile(data, file) {
    if (data.role == 'user') {
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
            { image: imageUrl, ...updateData },
            { where: { id: userId } }
          );
        } else {
          await UserModelResult.update(updateData, { where: { id: userId } });
        }
      } catch (error) {
        console.log(error);
        throw new SystemError(error.name, error.parent);
      }
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

      const phone = response.data.responseBody.mobileNumber;

      //authService.sendNINVerificationCode(phone, userId, role)
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
    const { userId } = await userUtil.verifyHandleGetMyMerchant.validateAsync(
      data
    );

    try {
      const MymatchModel = await this.MymatchModel.findOne({
        userId: userId,
      });
      if (MymatchModel) {
        let matches = matchData.matches;
        if (typeof matches === 'string') {
          matches = JSON.parse(matches);
        }
        for (let i = 0; i < matches.length; i++) {
          let merchant = await this.UserModel.findOne({
            where: { id: matches[i].merchantId },
            include: [
              {
                model: MerchantProfile,
                as: 'MerchantProfile',
                attributes: ['displayname'],
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
            attributes: ['tel'],
          });
          merchant.distance = matches[i].distance;
          matches[i] = merchant;
        }
        return matches;
      } else {
        return [];
      }
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }

  async handleSignupMerchant(data) {
    const { displayname, userId } =
      await userUtil.verifyHandleSignupMerchant.validateAsync(data);

    try {
      await this.MerchantProfileModel.create({
        displayname: displayname,
        accoutTier: 1,
        userId: userId,
        accountStatus: 'active',
      });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  async handleCreateMerchantAds(data) {
    const { minAmount, maxAmount, pricePerThousand, userId } =
      await userUtil.verifyHandleCreateMerchantAds.validateAsync(data);

    try {
      await this.MerchantAdsModel.upsert({
        minAmount,
        maxAmount,
        userId,
        pricePerThousand,
      });
    } catch (error) {
      throw new SystemError(error.name, error.parent);
    }
  }
  async makeMatch() {
    try {
      // Check if match process is running
      const setting = await this.SettingModel.findByPk(1);
      if (setting.isMatchRunning) return;
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
}

export default new UserService();
