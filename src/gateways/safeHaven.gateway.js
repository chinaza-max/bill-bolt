import BaseGateway from './baseGateway.js';
import serverConfig from    '../config/server.js'//'./baseGateway.js';
import axios from 'axios';
import qs from 'qs';

class ExampleGateway extends BaseGateway {



  constructor(gateWayEnvironment) {
    this.apiUrl = gateWayEnvironment==="sandBox" ?   'https://api.sandbox.safehavenmfb.com': 'https://api.safehavenmfb.com'; 
    this.apiKey = process.env.SAVE_HAVEN_API_KEY; 
    this.clientAssertionType= serverConfig.CLIENT_ASSERTION_TYPE
    this.clientId = serverConfig.CLIENTID
    this.clientAssertion = serverConfig.CLIENT_ASSERTION
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

  async generateSubAccount(subAccountData) {
    const url = `${this.apiUrl}/accounts/subaccount`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.post(url, subAccountData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'ClientID': this.clientId,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.generateSubAccount(subAccountData);
      }
      console.error('Error generating sub-account:', error);
      throw error;
    }
  }



  async initiateTransfer(transferData) {
    const url = `${this.apiUrl}/transfers`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.post(url, transferData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'ClientID': this.clientId,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.initiateTransfer(transferData);
      }
      console.error('Error initiating transfer:', error);
      throw error;
    }
  }


  checkBalance(accountNumber) {
    return { balance: 1000 };
  }

  async getTransfers(params) {
    const url = `${this.apiUrl}/transfers`;

    if (!this.accessToken) {
      console.log('Access token missing, generating a new one...');
      await this.generateRefreshToken();
      await this.getAccessToken();
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'ClientID': this.clientId,
        },
        params: {
          page: params.page || 0,
          limit: params.limit || 25,
          fromDate: params.fromDate || '',
          toDate: params.toDate || '',
          accountId: params.accountId || '',
          type: params.type || '',
          status: params.status || '',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Access token expired, refreshing token...');
        await this.getAccessToken();
        return this.getTransfers(params);
      }
      console.error('Error fetching transfers:', error);
      throw error;
    }
  }

  
}

export default ExampleGateway;
