import { Router } from 'express';
import identityController from '../controllers/identity/identity.controller.js';
import identityAuthMiddleware from '../middlewares/identityAuth.middleware.js';

class IdentityRoutes {
  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    // ─── PUBLIC AUTH ROUTES ───────────────────────────────────
    this.router.post('/auth/register', identityController.register);
    this.router.post('/auth/login', identityController.login);

    // ─── INTERNAL BACKEND ROUTES (No client API key required) ─────
    this.router.post('/internal/nin/initiate', identityController.internalInitiateNIN);
    this.router.post('/internal/nin/verify', identityController.internalVerifyNIN);

    // ─── PROTECTED ROUTES (API Key or Bearer token) ───────────
    this.router.use(identityAuthMiddleware.authenticate);

    // Profile & Settings
    this.router.get('/profile', identityController.getProfile);
    this.router.post('/api-key/rotate', identityController.rotateApiKey);
    this.router.post('/settings/webhook', identityController.updateWebhook);

    // Wallet & Transactions
    this.router.post('/wallet/fund', identityController.fundWallet);
    this.router.get('/wallet/balance', identityController.getBalance);
    this.router.get('/transactions', identityController.getTransactions);

    // NIN Verification
    this.router.post('/nin/initiate', identityController.initiateNIN);
    this.router.post('/nin/verify', identityController.verifyNIN);
  }
}

export default new IdentityRoutes().router;
