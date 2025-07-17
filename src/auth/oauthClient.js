import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const CREDENTIALS_PATH = path.join(__dirname,'../../client_secret_863654793563-0onc4ke09hed1p8j62jtbfbtduamm85c.apps.googleusercontent.com.json');
//const TOKEN_PATH = path.join(__dirname, '../../token.json');

//const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
//const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8')
);
const tokens = JSON.parse(
  Buffer.from(process.env.GOOGLE_TOKENS_BASE64, 'base64').toString('utf8')
);

const { client_id, client_secret, redirect_uris } = credentials.installed;
console.log(client_id, client_secret, redirect_uris);
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

oAuth2Client.setCredentials(tokens);
// Export client + token path for reuse
export { oAuth2Client };
