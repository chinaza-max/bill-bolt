import identityService from '../../service/identity.service.js';

class IdentityController {
  async register(req, res, next) {
    try {
      const result = await identityService.handleRegister(req.body);
      return res.status(201).json({
        status: 201,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await identityService.handleLogin(req.body);
      return res.status(200).json({
        status: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await identityService.handleGetProfile(req.identityClient);
      return res.status(200).json({
        status: 200,
        message: 'Client profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async rotateApiKey(req, res, next) {
    try {
      const result = await identityService.handleRotateApiKey(req.identityClient);
      return res.status(200).json({
        status: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWebhook(req, res, next) {
    try {
      const result = await identityService.handleUpdateWebhook(
        req.identityClient,
        req.body
      );
      return res.status(200).json({
        status: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async fundWallet(req, res, next) {
    try {
      const result = await identityService.handleFundWallet(
        req.identityClient,
        req.body
      );
      return res.status(200).json({
        status: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req, res, next) {
    try {
      const result = await identityService.handleGetBalance(req.identityClient);
      return res.status(200).json({
        status: 200,
        message: 'Wallet balance retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const result = await identityService.handleGetTransactions(
        req.identityClient,
        req.query
      );
      return res.status(200).json({
        status: 200,
        message: 'Transactions retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async initiateNIN(req, res, next) {
    try {
      const isInternal = req.isInternal || false;
      const result = await identityService.handleInitiateNIN(
        req.identityClient,
        req.body,
        isInternal
      );
      return res.status(200).json({
        status: 200,
        message:
          'OTP sent. Copy the identityId from data below and use it to call verify endpoint.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyNIN(req, res, next) {
    try {
      const isInternal = req.isInternal || false;
      const result = await identityService.handleVerifyNIN(
        req.identityClient,
        req.body,
        isInternal
      );
      return res.status(200).json({
        status: 200,
        message: 'Verification result retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async internalInitiateNIN(req, res, next) {
    try {
      const result = await identityService.handleInitiateNIN(
        null,
        req.body,
        true
      );
      return res.status(200).json({
        status: 200,
        message: 'OTP sent successfully for internal backend NIN request',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async internalVerifyNIN(req, res, next) {
    try {
      const result = await identityService.handleVerifyNIN(
        null,
        req.body,
        true
      );
      return res.status(200).json({
        status: 200,
        message: 'Verification result for internal backend NIN request',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new IdentityController();
