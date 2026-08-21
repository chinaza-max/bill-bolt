import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import serverConfig from '../config/server.js';
import IdentityClient from '../db/models/identityClient.js';
import IdentityTransaction from '../db/models/identityTransaction.js';
import Setting from '../db/models/setting.js';
import identityUtil from '../utils/identity.util.js';
import { loadActiveGateway } from '../utils/gatewayLoader.js';
import mailService from '../service/mail.service.js';
import {
  BadRequestError,
  NotFoundError,
  UnAuthorizedError,
} from '../errors/index.js';

class IdentityService {
  constructor() {
    this.gateway = null;
  }

  async loadGateWay(gatewayName = 'safeHaven.gateway') {
    try {
      this.gateway = await loadActiveGateway(gatewayName);
    } catch (error) {
      console.error(`Failed to load gateway ${gatewayName}:`, error);
      throw error;
    }
  }

  generateApiKey() {
    return `id_live_${crypto.randomBytes(24).toString('hex')}`;
  }

  generateTransactionId(prefix = 'ID_TX') {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}_${timestamp}${random}`;
  }

  // ─── AUTH & PROFILE ──────────────────────────────────────────

  generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendEmailOtp(client) {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await client.update({ emailOtp: otp, emailOtpExpiresAt: expiresAt });

    await mailService.sendMail({
      to: client.email,
      subject: 'Email Verification – fidopoint Identity',
      templateName: 'emailVerificationCode',
      variables: {
        verificationCode: otp,
        email: client.email,
      },
    });
  }

  async handleRegister(obj) {
    const data = await identityUtil.registerSchema.validateAsync(obj);

    const existingEmail = await IdentityClient.findOne({
      where: { email: data.email, isDeleted: false },
    });

    if (existingEmail) {
      throw new BadRequestError('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const apiKey = this.generateApiKey();

    const client = await IdentityClient.create({
      companyName: data.companyName,
      cacNumber: data.cacNumber || null,
      address: data.address,
      contactName: data.contactName,
      email: data.email,
      password: hashedPassword,
      phoneNumber: data.phoneNumber || null,
      apiKey,
      walletBalance: 0.0,
      status: 'pending',          // 🔒 blocked until email verified
      isEmailVerified: false,
    });

    // 📧 Fire OTP email (don't block registration response)
    await this.sendEmailOtp(client).catch((err) =>
      console.error('[IdentityService] Failed to send verification OTP:', err.message)
    );

    return {
      message:
        'Registration successful. A 6-digit OTP has been sent to your email. Please verify before logging in.',
      client: {
        id: client.id,
        email: client.email,
        companyName: client.companyName,
        isEmailVerified: client.isEmailVerified,
      },
    };
  }

  async handleLogin(obj) {

    console.log("obj",obj)
  let data;
  try {
    data = await identityUtil.loginSchema.validateAsync(obj);
  } catch (err) {
    console.error("VALIDATION FAILED:", err.message, err.details);
    throw err;
  }   

      console.log("data",data)


   let client;
  try {
    client = await IdentityClient.findOne({
      where: { email: data.email, isDeleted: false },
    });
  } catch (err) {
    console.error("DB QUERY FAILED:", err.message);
    throw err;
  }

        console.log("client",client)


    if (!client) {
      throw new UnAuthorizedError('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(data.password, client.password);
    if (!isMatch) {
      throw new UnAuthorizedError('Invalid email or password.');
    }

    // 🔒 Block unverified accounts
    if (!client.isEmailVerified) {
      // Resend OTP so the client can verify
      await this.sendEmailOtp(client).catch(() => {});
      throw new UnAuthorizedError(
        'Email not verified. A new OTP has been sent to your email. Please verify before logging in.'
      );
    }

    if (client.status === 'suspended' || client.status === 'inactive') {
      throw new UnAuthorizedError('Identity account is inactive or suspended.');
    }

    const token = jwt.sign(
      { identityClientId: client.id, email: client.email },
      serverConfig.ACCESS_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    console.log("client",client)

    return {
      message: 'Login successful',
      token,
      client: {
        id: client.id,
        companyName: client.companyName,
        cacNumber: client.cacNumber,
        address: client.address,
        contactName: client.contactName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        apiKey: client.apiKey,
        walletBalance: client.walletBalance,
        webhookUrl: client.webhookUrl,
        createdAt: client.createdAt,
      },
    };
  }

  async handleVerifyEmailOtp(obj) {
    const data = await identityUtil.verifyEmailOtpSchema.validateAsync(obj);

    const client = await IdentityClient.findOne({
      where: { email: data.email, isDeleted: false },
    });

    if (!client) {
      throw new NotFoundError('No account found with this email.');
    }

    if (client.isEmailVerified) {
      throw new BadRequestError('Email is already verified. Please log in.');
    }

    if (!client.emailOtp || client.emailOtp !== String(data.otp)) {
      throw new BadRequestError('Invalid OTP. Please check and try again.');
    }

    if (!client.emailOtpExpiresAt || new Date() > new Date(client.emailOtpExpiresAt)) {
      throw new BadRequestError('OTP has expired. Please request a new one.');
    }

    // ✅ Mark verified, activate account
    await client.update({
      isEmailVerified: true,
      status: 'active',
      emailOtp: null,
      emailOtpExpiresAt: null,
    });

    const token = jwt.sign(
      { identityClientId: client.id, email: client.email },
      serverConfig.ACCESS_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    return {
      message: 'Email verified successfully. You can now log in.',
      token,
      client: {
        id: client.id,
        companyName: client.companyName,
        email: client.email,
        apiKey: client.apiKey,
        walletBalance: client.walletBalance,
        isEmailVerified: client.isEmailVerified,
        status: client.status,
        createdAt: client.createdAt,
      },
    };
  }

  async handleResendEmailOtp(obj) {
    const data = await identityUtil.resendEmailOtpSchema.validateAsync(obj);

    const client = await IdentityClient.findOne({
      where: { email: data.email, isDeleted: false },
    });

    if (!client) {
      throw new NotFoundError('No account found with this email.');
    }

    if (client.isEmailVerified) {
      throw new BadRequestError('Email is already verified. Please log in.');
    }

    await this.sendEmailOtp(client);

    return {
      message: 'A new 6-digit OTP has been sent to your email.',
      email: client.email,
    };
  }

  async handleGetProfile(client) {
    return {
      id: client.id,
      companyName: client.companyName,
      cacNumber: client.cacNumber,
      address: client.address,
      contactName: client.contactName,
      email: client.email,
      phoneNumber: client.phoneNumber,
      apiKey: client.apiKey,
      walletBalance: client.walletBalance,
      webhookUrl: client.webhookUrl,
      status: client.status,
      createdAt: client.createdAt,
    };
  }

  async handleRotateApiKey(client) {
    const newApiKey = this.generateApiKey();
    client.apiKey = newApiKey;
    await client.save();

    return {
      message: 'API Key rotated successfully',
      apiKey: newApiKey,
    };
  }

  async handleDeleteAccount(client) {
    const clientId = client.id;

    // Permanently remove all identity transaction records for this client
    await IdentityTransaction.destroy({
      where: { clientId },
    });

    // Permanently remove the client record
    await client.destroy();

    return {
      message: 'Identity client account and all associated records permanently deleted.',
    };
  }

  async handleUpdateWebhook(client, obj) {
    const data = await identityUtil.updateWebhookSchema.validateAsync(obj);
    client.webhookUrl = data.webhookUrl;
    await client.save();

    return {
      message: 'Webhook URL updated successfully',
      webhookUrl: client.webhookUrl,
    };
  }

  // ─── WALLET & TRANSACTIONS ──────────────────────────────────

  async handleFundWallet(client, obj) {
    const data = await identityUtil.fundWalletSchema.validateAsync(obj);
    const amount = Number(data.amount);

    await this.loadGateWay('safeHaven.gateway');

    const setting = (await Setting.findByPk(1)) || {};
    const validFor = setting.validFor || 900;
    const callbackUrl = setting.callbackUrl || 'https://';

    const transactionId = this.generateTransactionId('ID_FUND');
    const sessionIdVirtualAcct = `sess_id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    let virtualAccountResult;

    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      virtualAccountResult = await this.gateway.createVirtualAccount(
        validFor,
        'Fixed',
        amount,
        callbackUrl,
        transactionId
      );

      await IdentityTransaction.create({
        clientId: client.id,
        transactionId,
        reference: transactionId,
        type: 'funding',
        amount: amount,
        previousBalance: client.walletBalance,
        newBalance: client.walletBalance, // will update on successful payment webhook
        paymentStatus: 'pending',
        virtualAccountId: virtualAccountResult.id,
        sessionIdVirtualAcct,
        virtualAccountDetails: {
          bankName: virtualAccountResult.bankName,
          accountNumber: virtualAccountResult.accountNumber,
          accountName: virtualAccountResult.accountName,
          bankCode: virtualAccountResult.bankCode,
          amount: amount,
          expiresInSeconds: validFor,
        },
      });

      return {
        message:
          'Virtual account generated for wallet funding. Transfer funds to complete.',
        transactionId,
        virtualAccount: {
          bankName: virtualAccountResult.bankName,
          accountNumber: virtualAccountResult.accountNumber,
          accountName: virtualAccountResult.accountName,
          bankCode: virtualAccountResult.bankCode,
          amount: amount,
          expiresInSeconds: validFor,
        },
      };
    } else {
      // DEV/TEST MODE: Credit wallet balance instantly without waiting for webhook
      const previousBalance = client.walletBalance;
      const newBalance = previousBalance + amount;

      client.walletBalance = newBalance;
      await client.save();

      virtualAccountResult = {
        bankName: 'SafeHaven Microfinance Bank (Dev/Test)',
        accountNumber: '990' + Math.floor(10000000 + Math.random() * 90000000),
        accountName: `BILLBOLT - ${client.companyName}`,
        sessionId: sessionIdVirtualAcct,
        amount: amount,
        bankCode: '090286',
        countDown: validFor,
        id: `dummy-${transactionId}`,
      };

      await IdentityTransaction.create({
        clientId: client.id,
        transactionId,
        reference: transactionId,
        type: 'funding',
        amount: amount,
        previousBalance,
        newBalance,
        paymentStatus: 'successful',
        virtualAccountId: virtualAccountResult.id,
        sessionIdVirtualAcct,
        virtualAccountDetails: virtualAccountResult,
      });

      return {
        message: `[DEV MODE] Wallet funded instantly with ₦${amount}. Current balance: ₦${newBalance}.`,
        transactionId,
        previousBalance,
        newBalance: client.walletBalance,
        virtualAccount: virtualAccountResult,
      };
    }
  }

  async handleGetBalance(client) {
    return {
      walletBalance: client.walletBalance,
      currency: 'NGN',
    };
  }

  async handleGetTransactions(client, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = { clientId: client.id, isDeleted: false };
    if (query.type) whereClause.type = query.type;
    if (query.status) whereClause.paymentStatus = query.status;

    const { rows, count } = await IdentityTransaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      transactions: rows,
    };
  }

  // ─── NIN VERIFICATION ───────────────────────────────────────

  async handleInitiateNIN(client, obj, isInternal = false) {
    const data = await identityUtil.initiateNINSchema.validateAsync(obj);
    const setting = (await Setting.findByPk(1)) || {};

    const ninFee = setting.ninVerificationAmount ?? 60.0;
    const debitAccountNumber =
      serverConfig.DEBIT_ACCOUNT_NUMBER_IDENTITY;

    if (!debitAccountNumber) {
      throw new BadRequestError(
        'Backend debit account number is not configured in environment or settings.'
      );
    }

    let previousBalance = 0;
    let newBalance = 0;

    if (!isInternal && client) {
      if (client.walletBalance < ninFee) {
        throw new BadRequestError(
          `Insufficient wallet balance. NIN verification costs ₦${ninFee}. Current balance: ₦${client.walletBalance}. Please fund your identity account.`
        );
      }

      previousBalance = client.walletBalance;
      newBalance = previousBalance - ninFee;
      client.walletBalance = newBalance;
      await client.save();
    }

    const transactionId = this.generateTransactionId('ID_NIN');

    await this.loadGateWay('safeHaven.gateway');

    let gatewayResult;
    try {
      gatewayResult = await this.gateway.initiateVerification({
        type: data.type || 'NIN',
        number: data.number,
        debitAccountNumber,
        async: data.async || false,
      });
    } catch (error) {
      // Refund if gateway initiation failed and client balance was debited
      if (!isInternal && client) {
        client.walletBalance = previousBalance;
        await client.save();
      }
      throw error;
    }

    const identityId =
      gatewayResult?.data?._id ||
      gatewayResult?.data?.identityId ||
      gatewayResult?._id;

    await IdentityTransaction.create({
      clientId: client ? client.id : 0,
      transactionId,
      reference: transactionId,
      type: 'verification_nin',
      amount: ninFee,
      previousBalance,
      newBalance,
      paymentStatus: 'pending',
      identityNumber: data.number,
      identityId: identityId || null,
      debitAccountNumber,
      providerResponse: gatewayResult,
    });

    return gatewayResult;
  }

  async handleVerifyNIN(client, obj, isInternal = false) {
    const data = await identityUtil.verifyNINSchema.validateAsync(obj);

    await this.loadGateWay('safeHaven.gateway');

    const gatewayResult = await this.gateway.validateVerification({
      identityId: data.identityId,
      type: data.type || 'NIN',
      otp: data.otp,
    });

    const transaction = await IdentityTransaction.findOne({
      where: { identityId: data.identityId },
      order: [['createdAt', 'DESC']],
    });

    if (transaction) {
      transaction.paymentStatus = 'successful';
      transaction.providerResponse = gatewayResult;
      await transaction.save();
    }

    // Trigger webhook notification if client has webhookUrl configured
    if (client && client.webhookUrl) {
      this.dispatchWebhook(client.webhookUrl, {
        event: 'identity.nin.verified',
        timestamp: new Date().toISOString(),
        data: {
          transactionId: transaction?.transactionId || null,
          identityId: data.identityId,
          status: 'SUCCESS',
          verificationResult: gatewayResult,
        },
      }).catch((err) => {
        console.error('[IdentityService] Webhook dispatch failed:', err.message);
      });
    }

    return gatewayResult;
  }

  // ─── WEBHOOK DISPATCHER ─────────────────────────────────────

  async dispatchWebhook(webhookUrl, payload) {
    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Fidopoint-Identity-Service/1.0',
        },
        timeout: 10000,
      });
      console.log(`[IdentityService] Webhook successfully dispatched to ${webhookUrl}`);
    } catch (error) {
      console.error(
        `[IdentityService] Error dispatching webhook to ${webhookUrl}:`,
        error.response?.data || error.message
      );
    }
  }
}

export default new IdentityService();
