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

  async uploadImageGoogleDrive(req, res, next) {
    try {
      const { file } = req;

      if (!file) {
        return res.status(400).json({
          status: 400,
          message: 'No file uploaded',
        });
      }

      const imageUrl = await userService.handleUploadImageGoogleDrive(file);

      return res.status(200).json({
        status: 200,
        message: 'Image uploaded successfully',
        data: { imageUrl },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async updateMerchantProfile(req, res, next) {
    try {
      const { image, ...data } = req.body;
      const { file } = req;
      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleUpdateMerchantProfile(my_bj, file);

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

  async initiateNINVerify(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
        // role: req.user.role,
      };

      await userService.handleInitiateNINVerify(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'opt has been sent to the number attached to the nin',
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
        message: 'successfully.',
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
          message: 'Invalid pass code',
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
        maxAge: serverConfig.REFRESH_TOKEN_COOKIE_EXPIRES_IN,
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
      const data = req.query;

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
  async confirmTransfer(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleConfirmTransfer(my_bj);

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

      const result = await userService.handleGenerateAccountVirtual(my_bj);

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

  async getChargeSummary(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetChargeSummary(my_bj);

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

  async getMyOrderDetails(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetMyOrderDetails(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: result,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async getTransactionHistoryOrder(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetTransactionHistoryOrder(my_bj);

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

  async getMerchantProfile(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetMerchantProfile(my_bj);

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
  async getOrderStatistic(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetOrderStatistic(my_bj);

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

  async whoIAm(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleWhoIAm(my_bj);

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

  async getTransaction(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetTransaction(my_bj);

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

  async getAdmins(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetAdmins(my_bj);

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

  async updateAdmin(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleUpdateAdmin(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async deleteAdmin(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleDeleteAdmin(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async createAdmin(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleCreateAdmin(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetUsers(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: { ...result },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getUsersData(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        userId: data.id,
      };
      const result = await userService.handleGetUsersData(my_bj);

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

  async updateMerchantStatus(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        // userId: data.userId,
      };

      console.log(my_bj);

      await userService.handleUpdateMerchantStatus(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async transferMoney(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleTransferMoney(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async nameEnquiry(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleNameEnquiry(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async getBank(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        //userId: req.user.id,
      };

      const data2 = await userService.handleGetBank(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: data2,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async dashBoardStatistic(req, res, next) {
    try {
      let my_bj = {
        userId: req.user.id,
      };

      const result = await userService.handleDashBoardStatistic(my_bj);

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
  async getdefaultAds(req, res, next) {
    try {
      let my_bj = {
        userId: req.user.id,
      };

      const result = await userService.handleGetdefaultAds(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: { ...result },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async manageBreakPoint(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      console.log(my_bj);

      const result = await userService.handleManageBreakPoint(my_bj);

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

  async updateComplainStatus(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleUpdateComplainStatus(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async getComplain(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetComplain(my_bj);

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

  async getSettings(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetSettings(my_bj);

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

  async setMerchantAccountStatus(req, res, next) {
    try {
      const data = req.body;

      let my_bj = { ...data, userId: req.user.id };

      const result = await userService.handleSetMerchantAccountStatus(my_bj);

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

  async submitUserMessage(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleSubmitUserMessage(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async updateToken(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleUpdateToken(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: 'Token updated successfully',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.fetchNotifications(my_bj);

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

  async toggleDelete(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await userService.toggleDelete(id);

      return res.status(200).json({
        status: 200,
        message: `Notification ${
          notification.isDeleted ? 'deleted' : 'restored'
        }`,
        data: notification,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id; // assuming auth middleware sets req.user
      const count = await userService.countUnreadNotifications(userId);

      return res.status(200).json({
        status: 200,
        message: 'Unread notifications fetched successfully',
        data: { unreadCount: count },
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await userService.markAsRead(id);

      return res.status(200).json({
        status: 200,
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  async getProfileInformation(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetProfileInformation(my_bj);

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
  async getMyRangeLimit(req, res, next) {
    try {
      let my_bj = {
        userId: req.user.id,
      };

      const result = await userService.handleGetMyRangeLimit(my_bj);

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
  /*
  async getMyRangeLimit(req, res, next) {
    try {
      let my_bj = {
        userId: req.user.id,
      };

      const result = await userService.handleGetMyRangeLimit(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: result,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }*/
  async getMyAds(req, res, next) {
    try {
      let my_bj = {
        userId: req.user.id,
      };

      const result = await userService.handleGetMyAds(my_bj);

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
  async submitComplain(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleSubmitComplain(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async updateMerchantVerificationProcess(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      userService.handleUpdateMerchantVerificationProcess(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async setWithdrawalBank(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleSetWithdrawalBank(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async makeOrderPayment(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleMakeOrderPayment(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async getMerchantInformation(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetMerchantInformation(my_bj);

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

  async getGeneralTransaction(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetGeneralTransaction(my_bj);

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
  async getTransactionHistory(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetTransactionHistory(my_bj);

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
  async verifyCompleteOrder(req, res, next) {
    try {
      const data = req.body;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleverifyCompleteOrder(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'successfully.',
        data: 'success',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async orderAcceptOrCancel(req, res, next) {
    try {
      const data = req.body;
      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      await userService.handleOrderAcceptOrCancel(my_bj);

      return res.status(200).json({
        status: 200,
        message: 'success.',
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const data = req.query;

      let my_bj = {
        ...data,
        userId: req.user.id,
      };

      const result = await userService.handleGetMyOrders(my_bj);

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
  async getChatHistory(req, res, next) {
    try {
      const data = req.query;
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
