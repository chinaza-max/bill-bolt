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
    this.router.post('/updateMerchantProfile', this.updateMerchantProfile);
    this.router.post('/updatePin', this.updatePin);
    this.router.post('/verifyNIN', this.verifyNIN);
    this.router.post('/initiateNINVerify', this.verifyNIN);

    this.router.post('/setPin', this.setPin);
    this.router.post('/enterPassCode', this.enterPassCode);

    this.router.get('/getMyMerchant', this.getMyMerchant);
    this.router.post('/generateAccountVirtual', this.generateAccountVirtual);
    this.router.get('/getChatHistory', this.getChatHistory);
    this.router.get('/getMyOrders', this.getMyOrders);
    this.router.post('/orderAcceptOrCancel', this.orderAcceptOrCancel);
    this.router.post('/verifyCompleteOrder', this.verifyCompleteOrder);
    this.router.post('/getMyOrderDetails', this.getMyOrderDetails);

    //Transaction api
    this.router.post(
      '/getTransactionHistoryOrder',
      this.getTransactionHistoryOrder
    );

    this.router.get('/getTransactionHistory', this.getTransactionHistory);
    this.router.post('/setWithdrawalBank', this.setWithdrawalBank);
    this.router.get('/getBank', this.getBank);
    this.router.get('/nameEnquiry', this.nameEnquiry);
    this.router.get('/transferMoney', this.transferMoney);
    this.router.post('/submitComplain', this.submitComplain);
    this.router.post(
      '/setMerchantAccountStatus',
      this.setMerchantAccountStatus
    );
    this.router.get('/getProfileInformation', this.getProfileInformation);

    //MERCHANT API
    this.router.post('/signupMerchant', this.signupMerchant);
    this.router.get('/getMyAds', this.getMyAds);
    this.router.post('/createMerchantAds', this.createMerchantAds);
    this.router.get('/getdefaultAds', this.getdefaultAds);
    this.router.get('/getMyRangeLimit', this.getMyRangeLimit);
    this.router.get('/getOrderStatistic', this.getOrderStatistic);

    //ADMIN
    this.router.post('/dashBoardStatistic', this.dashBoardStatistic);
    this.router.get('/getUsers', this.getUsers);
    this.router.get('/getTransaction', this.getTransaction);

    this.router.get('/whoIAm', this.whoIAm);
  }
}

export default new UserRoutes().router;
