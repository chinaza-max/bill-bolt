import path from 'path';
import { Setting as SettingModel } from '../db/models/index.js';

export async function loadActiveGateway(gatewayName) {
  try {
    const Gateway = require(path.resolve(
      `./gateways/${gatewayName}.js`
    )).default;
    console.log(Gateway);

    return new Gateway();
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to load gateway: ${error.message}`);
  }
}
