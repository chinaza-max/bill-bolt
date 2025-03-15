import { Router } from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import uploadHandler from '../middlewares/upload.middleware.js';
import { rateLimit } from 'express-rate-limit';

class AuthRoutes extends AuthController {
  constructor() {
    super();
    this.router = Router();
    this.routes();
  }

  routes() {
    const loginLimiter = rateLimit({
      windowMs: 3 * 60 * 1000, // 15 minutes
      max: 3, // limit each IP to 5 requests per windowMs
    });

    this.router.post('/registerUser', this.signupUser);
    this.router.post('/verifyEmailorTel', this.verifyEmailorTel);
    this.router.post(
      '/sendVerificationCodeEmailOrTel',
      this.sendVerificationCodeEmailOrTel
    );

    this.router.post(
      '/sendVerificationCodeEmailOrTel',
      this.sendVerificationCodeEmailOrTel
    );

    this.router.post('/enterPassCode', this.enterPassCode);

    this.router.get('/resetPasswordPage', this.resetPasswordPage);

    this.router.post('/loginUser' /*, loginLimiter*/, this.loginUser);
    this.router.post('/sendPasswordResetLink', this.sendPasswordResetLink);
    this.router.post('/resetPassword', this.resetPassword);
    this.router.post('/refreshAccessToken', this.refreshAccessToken);
    this.router.post(
      '/virtualAccountCollection',
      this.virtualAccountCollection
    );

    this.router.get('/ping', (req, res) => {
      console.log('ddddddddddd');
      console.log('ddddddddddd');
      res.status(200).json({ message: 'Pong!' });
    });
  }
}

export default new AuthRoutes().router;
