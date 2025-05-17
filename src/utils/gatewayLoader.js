import path from 'path';
import { pathToFileURL } from 'url';
import { Setting as SettingModel } from '../db/models/index.js';

export async function loadActiveGateway(gatewayName) {
  try {
    const modulePath = path.resolve(`./src/gateways/${gatewayName}.js`);

    console.log('Loading gateway module:', modulePath);
    const GatewayModule = await import(pathToFileURL(modulePath).href);
    const Gateway = GatewayModule.default;

    return new Gateway();
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to load gateway: ${error.message}`);
  }
}
