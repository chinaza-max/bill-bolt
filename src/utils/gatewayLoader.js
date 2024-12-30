
import path from 'path';
import service from '../service/user.service.js';


export async function loadActiveGateway() {
  try {
    const gatewayName = await service.getActiveGateway();
    const Gateway = require(path.resolve(`./gateways/${gatewayName}.js`)).default;
    return new Gateway();
  } catch (error) {
    throw new Error(`Failed to load gateway: ${error.message}`);
  }
}
