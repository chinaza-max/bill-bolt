// gateways/ExampleGateway.js
import BaseGateway from './baseGateway.js';
import serverConfig from    '../config/server.js'//'./baseGateway.js';


class ExampleGateway extends BaseGateway {



  constructor(gateWayEnvironment) {
    this.apiUrl = gateWayEnvironment==="sandBox" ?   'https://api.sandbox.safehavenmfb.com': 'https://api.safehavenmfb.com'; 
    this.apiKey = process.env.SAVE_HAVEN_API_KEY; 
    this.clientAssertionType= serverConfig.CLIENT_ASSERTION_TYPE
    this.clientId = serverConfig.CLIENTID
    this.clientAssertion = serverConfig.CLIENT_ASSERTION
  }


  generateAccountNumber() {
    return `ACC${Math.floor(100000 + Math.random() * 900000)}`;
  }

  initiateTransfer(data) {
    return { success: true, transferId: 'TRX123456' };
  }

  checkBalance(accountNumber) {
    return { balance: 1000 };
  }

  getTransactions(accountNumber) {
    return [
      { id: 'TRX123456', amount: 100, type: 'debit', status: 'success' },
    ];
  }
}

export default ExampleGateway;
