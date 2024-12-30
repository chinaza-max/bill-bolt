// gateways/BaseGateway.js
export default class BaseGateway {
    generateAccountNumber() {
      throw new Error('generateAccountNumber method not implemented');
    }
  
    initiateTransfer(data) {
      throw new Error('initiateTransfer method not implemented');
    }
  
    checkBalance(accountNumber) {
      throw new Error('checkBalance method not implemented');
    }
  
    getTransactions(accountNumber) {
      throw new Error('getTransactions method not implemented');
    }
  }
  