import { User, EmailandTelValidation } from '../db/models/index.js';
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

import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  SystemError,
} from '../errors/index.js';

class UserService {
  EmailandTelValidationModel = EmailandTelValidation;
  UserModel = User;

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

//
