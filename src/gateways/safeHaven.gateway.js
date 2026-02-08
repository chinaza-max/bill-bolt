import BaseGateway from './baseGateway.js';
import serverConfig from '../config/server.js';
import axios from 'axios';
import qs from 'qs';

class SafeHavenGateway extends BaseGateway {
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
    this.refreshToken = null;
    this.accessToken = null;
  }

  /* ---------------------- AUTH ---------------------- */

  async generateRefreshToken() {
    const url = `${this.apiUrl}/oauth2/token`;
    const data = qs.stringify({
      grant_type: 'client_credentials',
      client_assertion_type: this.clientAssertionType,
      client_id: this.clientId,
      client_assertion: this.clientAssertion,
    });

    try {
      const response = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      this.refreshToken = response.data.refresh_token;
      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      console.error(
        'Error generating refresh token:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getAccessToken() {
    const url = `${this.apiUrl}/oauth2/token`;
    const data = qs.stringify({
      grant_type: 'refresh_token',
      client_assertion_type: this.clientAssertionType,
      client_id: this.clientId,
      client_assertion: this.clientAssertion,
      refresh_token: this.refreshToken,
    });

    try {
      const response = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      console.error(
        'Error getting access token:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async ensureToken() {
    if (!this.accessToken) {
      await this.generateRefreshToken();
    }
  }

  /* ------------------ VIRTUAL ACCOUNTS ------------------ */

  // Create Virtual Account
  async createVirtualAccount({
    validFor = 900,
    amountControl,
    amount,
    callbackUrl,
    externalReference,
  }) {
    await this.ensureToken();

    const url = `${this.apiUrl}/virtual-accounts`;
    const data = {
      validFor,
      settlementAccount: {
        bankCode: serverConfig.BANK_CODE,
        accountNumber: serverConfig.ACCOUNT_NUMBER,
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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.createVirtualAccount({
          validFor,
          amountControl,
          amount,
          callbackUrl,
          externalReference,
        });
      }
      console.error(
        'Error creating virtual account:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Get Virtual Account Details
  async getVirtualAccount(accountId) {
    await this.ensureToken();

    const url = `${this.apiUrl}/virtual-accounts/${accountId}`;

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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getVirtualAccount(accountId);
      }
      console.error(
        'Error getting virtual account:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Update Virtual Account
  async updateVirtualAccount(accountId, updateFields) {
    await this.ensureToken();

    const url = `${this.apiUrl}/virtual-accounts/${accountId}`;

    try {
      const response = await axios.put(url, updateFields, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.updateVirtualAccount(accountId, updateFields);
      }
      console.error(
        'Error updating virtual account:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Delete Virtual Account
  async deleteVirtualAccount(accountId) {
    await this.ensureToken();

    const url = `${this.apiUrl}/virtual-accounts/${accountId}`;

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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.deleteVirtualAccount(accountId);
      }
      console.error(
        'Error deleting virtual account:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Get Virtual Account Transfer Status
  async getVirtualAccountTransferStatus(sessionId) {
    await this.ensureToken();

    const url = `${this.apiUrl}/virtual-accounts/status`;
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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getVirtualAccountTransferStatus(sessionId);
      }
      console.error(
        'Error fetching virtual account transfer status:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Get Virtual Account Transactions
  async getVirtualAccountTransactions(virtualAccountId) {
    await this.ensureToken();

    const url = `${this.apiUrl}/virtual-accounts/${virtualAccountId}/transaction`;

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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getVirtualAccountTransactions(virtualAccountId);
      }
      console.error(
        'Error getting virtual account transactions:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /* ------------------ IDENTITY VERIFICATION ------------------ */

  async initiateVerification({
    NIN,
    debitAccountNumber,
    otp,
    verifierId = 'default',
    provider = 'creditRegistry',
    async = true,
  }) {
    await this.ensureToken();

    const url = `${this.apiUrl}/identity/v2`;
    const data = {
      type: 'NIN',
      number: NIN,
      debitAccountNumber,
      otp,
      verifierId,
      provider,
      async,
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
      if (error.response?.status === 401) {
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
      console.error(
        'Error initiating verification:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async validateVerification({ identityId, type, otp }) {
    await this.ensureToken();

    const url = `${this.apiUrl}/identity/v2/validate`;
    const data = {
      identityId,
      type,
      otp,
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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.validateVerification({ identityId, type, otp });
      }
      console.error(
        'Error validating verification:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /* ------------------ TRANSFERS ------------------ */

  async getBankList() {
    await this.ensureToken();

    const url = `${this.apiUrl}/transfers/banks`;

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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getBankList();
      }
      console.error(
        'Error fetching bank list:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async nameEnquiry(bankCode, accountNumber) {
    await this.ensureToken();

    const url = `${this.apiUrl}/transfers/name-enquiry`;
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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.nameEnquiry(bankCode, accountNumber);
      }
      console.error(
        'Error performing name enquiry:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async initiateTransfer(payload) {
    await this.ensureToken();

    const url = `${this.apiUrl}/transfers`;
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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.initiateTransfer(payload);
      }
      console.error(
        'Error initiating transfer:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getTransferStatus(sessionId) {
    await this.ensureToken();

    const url = `${this.apiUrl}/transfers/status`;
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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getTransferStatus(sessionId);
      }
      console.error(
        'Error fetching transfer status:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getTransfers(params) {
    await this.ensureToken();

    const url = `${this.apiUrl}/transfers`;

    try {
      const queryString = qs.stringify(params, { addQueryPrefix: true });
      const response = await axios.get(`${url}${queryString}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ClientID: this.clientId,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getTransfers(params);
      }
      console.error(
        'Error fetching transfers:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /* ------------------ ACCOUNTS ------------------ */

  async getAccount(accountId) {
    await this.ensureToken();

    const url = `${this.apiUrl}/accounts/${accountId}`;

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
      if (error.response?.status === 401) {
        await this.getAccessToken();
        return this.getAccount(accountId);
      }
      console.error(
        'Error fetching account details:',
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

export default SafeHavenGateway;
