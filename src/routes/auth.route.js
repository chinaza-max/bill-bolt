import { Router } from"express";
import AuthController from "../controllers/auth/auth.controller.js";
import uploadHandler from "../middlewares/upload.middleware.js";

class AuthRoutes extends AuthController {
  constructor() {
    super();
    this.router = Router();
    this.routes();
  }

  routes() {
  

    this.router.post("/registerUser", this.signupUser);
    this.router.post("/verifyEmailorTel", this.verifyEmailorTel);           
    this.router.post("/sendVerificationCodeEmailOrTel", this.sendVerificationCodeEmailOrTel);
    this.router.post("/loginUser", this.loginUser);
    this.router.post("/sendPasswordResetLink", this.sendPasswordResetLink);
    this.router.post("/resetPassword", this.resetPassword);

   /*
   
    this.router.post("/validateBankAccount", this.validateBankAccount);
    this.router.get("/pingme", this.pingme);
    this.router.post("/intializePayment", this.intializePayment);
    

    this.router.post("/webHookMonify",/* this.validateMonnifyIP, this.validateTransactionHash, this.webHookCollectionMonify);
    this.router.post("/webHookMonifyRefund",/* this.validateMonnifyIP, this.validateTransactionHash, this.webHookMonifyRefund);
    this.router.post("/webHookMonifyDisbursement",/* this.validateMonnifyIP, this.validateTransactionHash, this.webHookMonifyDisbursement);
    this.router.post("/authorizeTransfer",/* this.validateMonnifyIP, this.validateTransactionHash, this.authorizeTransfer);
*/

  }
}

export default new AuthRoutes().router;
