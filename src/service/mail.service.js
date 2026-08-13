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
   * Sends email via nodemailer with connection pooling & auto retry
   */
  async sendMail(options) {
    let filePath = `./src/resources/mailTemplates/${options.templateName}.html`;

    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = Handlebars.compile(source);
    const html = template(options.variables);

    const mailData = {
      from: `${options.from ? options.from : serverConfig.EMAIL_SENDER} <${
        serverConfig.EMAIL_USER
      }>`,
      to: options.to,
      subject: options.subject,
      html: html,
    };

    // Send via nodemailer with automatic retries for bursts
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const info = await this.transporter.sendMail(mailData);
        console.log(
          `[MailService] Email sent successfully on attempt ${attempt}:`,
          info.messageId || info.response
        );
        return true;
      } catch (error) {
        lastError = error;
        console.error(
          `[MailService] Attempt ${attempt}/${maxRetries} failed to send email to ${options.to}:`,
          error.message
        );
        DEBUG(`Error sending email attempt ${attempt}: ${error}`);

        if (attempt < maxRetries) {
          // Pause before retrying to allow burst peak to clear
          await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
        }
      }
    }

    throw lastError;
  }

  /*
  async sendViaESP32(emailCommand) {
    // ... disabled ...
  }
  */
}

export default new MailService();

