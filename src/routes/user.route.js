import { Router } from 'express';
import UserController from '../controllers/user/user.controller.js';
import uploadHandler from '../middlewares/upload.middleware.js';

class UserRoutes extends UserController {
  constructor() {
    super();
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/updateProfile',
      uploadHandler.image.single('image'),
      this.updateProfile
    );

    this.router.post(
      '/uploadImageGoogleDrive',
      uploadHandler.image.single('image'),
      this.uploadImageGoogleDrive
    );

    this.router.post(
      '/updateMerchantProfile',
      uploadHandler.image.single('image'),
      this.updateMerchantProfile
    );
    this.router.post('/updatePin', this.updatePin);
    this.router.post('/verifyNIN', this.verifyNIN);
    this.router.post('/initiateNINVerify', this.initiateNINVerify);
    this.router.post('/setPin', this.setPin);
    this.router.post('/enterPassCode', this.enterPassCode);
    this.router.get('/getMyMerchant', this.getMyMerchant);
    this.router.post('/generateAccountVirtual', this.generateAccountVirtual);
    this.router.post('/confirmTransfer', this.confirmTransfer);
    this.router.get('/getChatHistory', this.getChatHistory);
    this.router.get('/getMyOrders', this.getMyOrders);
    this.router.post('/orderAcceptOrCancel', this.orderAcceptOrCancel);
    this.router.post('/verifyCompleteOrder', this.verifyCompleteOrder);
    this.router.get('/getMyOrderDetails', this.getMyOrderDetails);
    this.router.post('/getChargeSummary', this.getChargeSummary);
    this.router.post('/getMerchantInformation', this.getMerchantInformation);
    this.router.post('/makeOrderPayment', this.makeOrderPayment);
    this.router.post('/submitComplain', this.submitComplain);
    this.router.get('/getProfileInformation', this.getProfileInformation);
    this.router.post(
      '/setMerchantAccountStatus',
      this.setMerchantAccountStatus
    );
    this.router.post(
      '/updateMerchantVerificationProcess',
      this.getProfileInformation
    );
    this.router.post('/submitUserMessage', this.submitUserMessage);
    this.router.post('/updateToken', this.updateToken);
    this.router.get('/notification', this.getNotifications);
    this.router.post('/notification/delete/:id', this.toggleDelete);
    this.router.get('/notification/unread/count', this.getUnreadCount);
    router.post('/notification/:id/read', this.markAsRead);

    //Transaction api
    this.router.get('/getGeneralTransaction', this.getGeneralTransaction);
    this.router.get(
      '/getTransactionHistoryOrder',
      this.getTransactionHistoryOrder
    );
    this.router.get('/getTransactionHistory', this.getTransactionHistory);
    this.router.post('/setWithdrawalBank', this.setWithdrawalBank);
    this.router.get('/getBank', this.getBank);
    this.router.get('/nameEnquiry', this.nameEnquiry);
    this.router.get('/transferMoney', this.transferMoney);

    //MERCHANT API
    this.router.post('/signupMerchant', this.signupMerchant);
    this.router.get('/getMyAds', this.getMyAds);
    this.router.post('/createMerchantAds', this.createMerchantAds);
    this.router.get('/getdefaultAds', this.getdefaultAds);
    this.router.get('/getMyRangeLimit', this.getMyRangeLimit);
    this.router.get('/getOrderStatistic', this.getOrderStatistic);
    this.router.get('/getMerchantProfile', this.getMerchantProfile);

    //ADMIN API
    this.router.get('/dashBoardStatistic', this.dashBoardStatistic);
    this.router.get('/getUsers', this.getUsers);
    this.router.get('/getUsersData', this.getUsersData);
    this.router.post('/updateMerchantStatus', this.updateMerchantStatus);
    this.router.post('/manageBreakPoint', this.manageBreakPoint);
    this.router.get('/getSettings', this.getSettings);
    this.router.get('/getComplains', this.getComplain);
    this.router.post('/updateComplainStatus', this.updateComplainStatus);
    this.router.get('/getTransaction', this.getTransaction);
    this.router.post('/createAdmin', this.createAdmin);
    this.router.get('/getadmins', this.getAdmins);
    this.router.post('/updateAdmin', this.updateAdmin);
    this.router.post('/deleteAdmin', this.deleteAdmin);

    this.router.get('/whoIAm', this.whoIAm);
  }
}

export default new UserRoutes().router;
