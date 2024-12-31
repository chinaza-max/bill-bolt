import { Router } from"express";
import AuthController from "../controllers/auth/auth.controller.js";
import uploadHandler from "../middlewares/upload.middleware.js";
import { rateLimit } from 'express-rate-limit'


class AuthRoutes extends AuthController {
  constructor() {
    super();
    this.router = Router();
    this.routes();
  }

  routes() {

    const loginLimiter = rateLimit({
      windowMs: 3 * 60 * 1000, // 15 minutes
      max: 3 // limit each IP to 5 requests per windowMs
    });
    

    this.router.post("/registerUser", this.signupUser);
    this.router.post("/verifyEmailorTel", this.verifyEmailorTel);           
    this.router.post("/sendVerificationCodeEmailOrTel", this.sendVerificationCodeEmailOrTel);
    this.router.post("/loginUser"/*,loginLimiter*/, this.loginUser);
    this.router.post("/sendPasswordResetLink", this.sendPasswordResetLink);
    this.router.post("/resetPassword", this.resetPassword);
    this.router.post("/refreshAccessToken", this.refreshAccessToken);
        

  }
}

export default new AuthRoutes().router;
