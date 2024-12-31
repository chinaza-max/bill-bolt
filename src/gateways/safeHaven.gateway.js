import BaseGateway from './baseGateway.js';
import serverConfig from '../config/server.js';
import axios from 'axios';
import qs from 'qs';

class ExampleGateway extends BaseGateway {
  constructor(gateWayEnvironment) {
    super();
    this.apiUrl =
      gateWayEnvironment === 'sandBox'
        ? 'https://api.sandbox.safehavenmfb.com'
        : 'https://api.safehavenmfb.com';
    this.apiKey = process.env.SAVE_HAVEN_API_KEY;
    this.clientAssertionType = serverConfig.CLIENT_ASSERTION_TYPE;
    this.clientId = serverConfig.CLIENTID;
    this.clientAssertion = serverConfig.CLIENT_ASSERTION;
  }

  async generateRefreshToken() {
    const url = `${this.apiUrl}/oauth2/token`;

    const data = qs.stringify({
      client_assertion_type: this.clientAssertionType,
      client_id: this.clientId,
      client_assertion: this.clientAssertion,
    });

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      this.refreshToken = response.data.refresh_token;
      return response.data;
    } catch (error) {
      console.error('Error generating refresh token:', error);
      throw error;
    }
  }

  async getAccessToken() {
    const url = `${this.apiUrl}/oauth2/token`;
    const data = qs.stringify({
      client_assertion_type: this.clientAssertionType,
      client_id: this.clientId,
      client_assertion: this.clientAssertion,
      refresh_token: this.refreshToken,
    });

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async getVirtualAccount(accountId) {
    const url = `${this.apiUrl}/virtual-accounts/${accountId}`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.getVirtualAccount(accountId);
      }
      console.error('Error fetching virtual account details:', error);
      throw error;
    }
  }

  async generateVirtualAccount(
    validFor = 900,
    settlementAccount,
    amountControl,
    amount,
    callbackUrl,
    externalReference
  ) {
    const url = `${this.apiUrl}/virtual-accounts`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    const data = {
      validFor,
      settlementAccount: {
        bankCode: settlementAccount.bankCode || '090286',
        accountNumber: settlementAccount.accountNumber || '',
      },
      amountControl,
      amount,
      callbackUrl,
      externalReference,
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.generateVirtualAccount(
          validFor,
          settlementAccount,
          amountControl,
          amount,
          callbackUrl,
          externalReference
        );
      }
      console.error('Error generating virtual account:', error);
      throw error;
    }
  }

  async getVirtualAccountTransferStatus(sessionId) {
    const url = `${this.apiUrl}/virtual-accounts/status`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    const data = { sessionId };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.getVirtualAccountTransferStatus(sessionId);
      }
      console.error('Error fetching virtual account transfer status:', error);
      throw error;
    }
  }

  async getVirtualTransaction(virtualAccountId) {
    const url = `${this.apiUrl}/virtual-accounts/${virtualAccountId}/transaction`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching virtual transaction:', error);
      throw error;
    }
  }

  async updateVirtualAccount(accountId, callbackUrl) {
    const url = `${this.apiUrl}/virtual-accounts/${accountId}`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    const data = {
      callbackUrl, // New callback URL to update
    };

    try {
      const response = await axios.put(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.updateVirtualAccount(accountId, callbackUrl);
      }
      console.error('Error updating virtual account:', error);
      throw error;
    }
  }
  async deleteVirtualAccount(accountId) {
    const url = `${this.apiUrl}/virtual-accounts/${accountId}`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.deleteVirtualAccount(accountId);
      }
      console.error('Error deleting virtual account:', error);
      throw error;
    }
  }
  async initiateVerification({
    NIN,
    debitAccountNumber,
    otp,
    verifierId = 'default',
    provider = 'creditRegistry',
    async = true,
  }) {
    const url = `${this.apiUrl}/identity/v2`;

    const data = {
      type: 'NIN', // Assuming 'BVN' as the default type, change accordingly
      debitAccountNumber, // Debit account number
      otp, // Only for BVNUSSD
      verifierId, // Default to 'default' for vNIN
      provider, // 'creditRegistry' or 'firstCentral'
      async, // true by default
    };
    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.initiateVerification({
          NIN,
          debitAccountNumber,
          otp,
          verifierId,
          provider,
          async,
        });
      }
      console.error('Error initiating verification:', error);
      throw error;
    }
  }
  async validateVerification({ identityId, type, otp }) {
    const url = `${this.apiUrl}/identity/v2/validate`;

    const data = {
      identityId, // The _id captured from the initial request
      type, // Verification type (NIN or BVN)
      otp, // OTP sent to the customer's phone
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data; // Return the response from the validation
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.validateVerification({ identityId, type, otp });
      }
      console.error('Error validating verification:', error);
      throw error;
    }
  }
  async getBankList() {
    const url = `${this.apiUrl}/transfers/banks`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bank list:', error);
      throw error;
    }
  }
  async nameEnquiry(bankCode, accountNumber) {
    const url = `${this.apiUrl}/transfers/name-enquiry`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    const data = {
      bankCode,
      accountNumber,
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.nameEnquiry(bankCode, accountNumber);
      }
      console.error('Error performing name enquiry:', error);
      throw error;
    }
  }
  async initiateTransfer(payload) {
    const url = `${this.apiUrl}/transfers`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    const data = {
      nameEnquiryReference: payload.nameEnquiryReference,
      debitAccountNumber: payload.debitAccountNumber,
      beneficiaryBankCode: payload.beneficiaryBankCode,
      beneficiaryAccountNumber: payload.beneficiaryAccountNumber,
      amount: payload.amount,
      saveBeneficiary: payload.saveBeneficiary || false,
      narration: payload.narration || '',
      paymentReference: payload.paymentReference || '',
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.initiateTransfer(payload);
      }
      console.error('Error initiating transfer:', error);
      throw error;
    }
  }
  async getTransferStatus(sessionId) {
    const url = `${this.apiUrl}/transfers/status`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    const data = { sessionId };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.getTransferStatus(sessionId);
      }
      console.error('Error fetching transfer status:', error);
      throw error;
    }
  }
}

export default ExampleGateway;
