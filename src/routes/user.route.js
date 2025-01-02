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
    this.router.post('/updatePin', this.updatePin);
    this.router.post('/verifyNIN', this.verifyNIN);
    this.router.post('/setPin', this.setPin);
    this.router.post('/enterPassCode', this.enterPassCode);
    this.router.post('/signupMerchant', this.signupMerchant);
    this.router.post('/getMyMerchant', this.getMyMerchant);
    this.router.post('/createMerchantAds', this.createMerchantAds);
    this.router.post('/generateAccountVirtual', this.generateAccountVirtual);

    /*
    this.router.get("/whoIAm", this.whoIAm);
    */
  }
}

export default new UserRoutes().router;
