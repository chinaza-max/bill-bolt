import nodemailer from 'nodemailer';
import fs from 'fs';
import debug from 'debug';
import Handlebars from 'handlebars';
// import mqtt from 'mqtt';
import serverConfig from '../config/server.js';

const DEBUG = debug('dev');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: serverConfig.EMAIL_HOST,
      port: Number(serverConfig.EMAIL_PORT),
      secure: Number(serverConfig.EMAIL_PORT) === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: serverConfig.EMAIL_USER,
        pass: serverConfig.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // MQTT client disabled / commented out
    // this.mqttClient = null;
    // this.mqttBroker =
    //   serverConfig.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
    // this.mqttTopic = serverConfig.MQTT_TOPIC || 'fidoesp32/email';
    // this.initMQTT();
  }

  // MQTT initialization commented out
  /*
  initMQTT() {
    try {
      this.mqttClient = mqtt.connect(this.mqttBroker);

      this.mqttClient.on('connect', () => {
        console.log('✓ MQTT connected to broker');
        DEBUG(`MQTT connected to ${this.mqttBroker}`);
      });

      this.mqttClient.on('error', (error) => {
        console.error('MQTT Error:', error);
        DEBUG(`MQTT Error: ${error}`);
      });

      this.mqttClient.on('offline', () => {
        console.log('MQTT client offline');
      });

      this.mqttClient.on('reconnect', () => {
        console.log('Reconnecting to MQTT...');
      });
    } catch (error) {
      console.error('Failed to initialize MQTT:', error);
      DEBUG(`MQTT init error: ${error}`);
    }
  }
  */

  // Simple HTML minifier (reduces size by ~30-40%)
  minifyHTML(html) {
    return (
      html
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove multiple spaces/newlines
        .replace(/\s+/g, ' ')
        // Remove spaces between tags
        .replace(/>\s+</g, '><')
        // Remove spaces around = in attributes
        .replace(/\s*=\s*/g, '=')
        // Trim
        .trim()
    );
  }

  /**
   * Sends email via nodemailer with connection pooling, auto retry & full diagnostic logs
   */
  async sendMail(options) {
    const timestamp = () => new Date().toISOString();

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[EMAIL][${timestamp()}] ▶ sendMail CALLED`);
    console.log(`[EMAIL] To       : ${options.to}`);
    console.log(`[EMAIL] Subject  : ${options.subject}`);
    console.log(`[EMAIL] Template : ${options.templateName}`);
    console.log(`[EMAIL] SMTP Host: ${serverConfig.EMAIL_HOST}:${serverConfig.EMAIL_PORT}`);
    console.log(`[EMAIL] SMTP User: ${serverConfig.EMAIL_USER}`);
    console.log(`[EMAIL] Sender   : ${serverConfig.EMAIL_SENDER}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let filePath = `./src/resources/mailTemplates/${options.templateName}.html`;

    // Step 1: Read template
    let source;
    try {
      source = fs.readFileSync(filePath, 'utf-8').toString();
      console.log(`[EMAIL] ✅ Step 1: Template file read OK → ${filePath}`);
    } catch (err) {
      console.error(`[EMAIL] ❌ Step 1: FAILED to read template file: ${filePath}`);
      console.error(`[EMAIL] Template Error:`, err.message);
      throw err;
    }

    // Step 2: Compile template
    let html;
    try {
      const template = Handlebars.compile(source);
      html = template(options.variables);
      console.log(`[EMAIL] ✅ Step 2: Handlebars template compiled OK (html length: ${html.length})`);
    } catch (err) {
      console.error(`[EMAIL] ❌ Step 2: FAILED to compile Handlebars template`);
      console.error(`[EMAIL] Handlebars Error:`, err.message);
      throw err;
    }

    const mailData = {
      from: `${options.from ? options.from : serverConfig.EMAIL_SENDER} <${serverConfig.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: html,
    };

    // Step 3: Send with retries
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      attempt++;
      console.log(`[EMAIL] ⏳ Step 3: Sending attempt ${attempt}/${maxRetries} → ${options.to}`);
      try {
        const info = await this.transporter.sendMail(mailData);
        console.log(`[EMAIL] ✅ Step 3: SENT OK on attempt ${attempt}`);
        console.log(`[EMAIL] Message ID : ${info.messageId || 'N/A'}`);
        console.log(`[EMAIL] Response   : ${info.response || 'N/A'}`);
        console.log(`[EMAIL] Accepted   : ${JSON.stringify(info.accepted || [])}`);
        console.log(`[EMAIL] Rejected   : ${JSON.stringify(info.rejected || [])}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        return true;
      } catch (error) {
        lastError = error;
        console.error(`[EMAIL] ❌ Attempt ${attempt}/${maxRetries} FAILED`);
        console.error(`[EMAIL] Error Code   : ${error.code || 'N/A'}`);
        console.error(`[EMAIL] Error Message: ${error.message}`);
        console.error(`[EMAIL] SMTP Response: ${error.response || 'N/A'}`);
        console.error(`[EMAIL] Response Code: ${error.responseCode || 'N/A'}`);
        console.error(`[EMAIL] Command     : ${error.command || 'N/A'}`);

        if (attempt < maxRetries) {
          const delay = attempt * 1200;
          console.log(`[EMAIL] ⏳ Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[EMAIL] ❌ ALL ${maxRetries} ATTEMPTS FAILED for → ${options.to}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    throw lastError;
  }

  /*
  async sendViaESP32(emailCommand) {
    // ... disabled ...
  }
  */
}

export default new MailService();

