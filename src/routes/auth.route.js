import { Router } from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import uploadHandler from '../middlewares/upload.middleware.js';
import { rateLimit } from 'express-rate-limit';
import { oAuth2Client } from '../auth/oauthClient.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    this.router.get('/verifyPinResetOtpPage', this.verifyPinResetOtpPage);

    this.router.post('/loginUser' /*, loginLimiter*/, this.loginUser);
    this.router.post('/sendPasswordResetLink', this.sendPasswordResetLink);
    this.router.post('/sendPinResetOtp', this.sendPinResetOtp);
    this.router.post('/verifyPinResetOtp', this.verifyPinResetOtp);

    this.router.post('/resetPassword', this.resetPassword);
    this.router.post('/refreshAccessToken', this.refreshAccessToken);
    this.router.post(
      '/virtualAccountCollection',
      this.virtualAccountCollection
    );

    this.router.get('/ping', (req, res) => {
      res.status(200).json({ message: 'Pong!' });
    });

    this.router.post(
      '/uploadImageGoogleDrive',
      uploadHandler.image.single('image'),
      this.uploadImageGoogleDrive
    );

    this.router.post(
      '/deleteFromAppfileGoogleDrive',
      this.deleteFromAppfileGoogleDrive
    );

    this.router.get('/oauth2callback', async (req, res) => {
      const code = req.query.code;

      if (!code) {
        return res.status(400).send('Missing authorization code.');
      }

      try {
        const { tokens } = await oAuth2Client.getToken(code);

        console.log(tokens);
        if (!tokens) {
          throw new Error('No tokens returned from Google.');
        }

        oAuth2Client.setCredentials(tokens);

        const TOKEN_PATH = path.join(__dirname, '../../token.json'); // or modify as needed

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        // fs.writeFileSync('../../token.json', JSON.stringify(tokens)); // or your TOKEN_PATH
        res.send('Authentication successful! You can now upload files.');
      } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('Authentication failed.');
      }
    });

    this.router.get('/oauth2', async (req, res) => {
      const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      res.redirect(authUrl);
    });
  }
}

export default new AuthRoutes().router;
