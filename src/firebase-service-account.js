import serverConfig from './config/server.js';

const firebaseConfig = {
  type: 'service_account',
  project_id: serverConfig.FIREBASE_PROJECT_ID,
  private_key_id: serverConfig.FIREBASE_PRIVATE_KEY_ID,
  private_key: serverConfig.FIREBASE_PRIVATE_KEY, // make sure your private key is properly escaped
  client_email: serverConfig.FIREBASE_CLIENT_EMAIL,
  client_id: serverConfig.FIREBASE_CLIENT_ID,
  auth_uri: serverConfig.FIREBASE_AUTH_URI,
  token_uri: serverConfig.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url:
    serverConfig.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: serverConfig.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: serverConfig.FIREBASE_UNIVERSAL_DOMAIN,
};

export default firebaseConfig;
