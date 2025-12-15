import nodemailer from 'nodemailer';
import fs from 'fs';
import debug from 'debug';
import Handlebars from 'handlebars';
import mqtt from 'mqtt';
import serverConfig from '../config/server.js';

const DEBUG = debug('dev');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: serverConfig.EMAIL_HOST,
      port: Number(serverConfig.EMAIL_PORT),
      secure: true,
      auth: {
        user: serverConfig.EMAIL_USER,
        pass: serverConfig.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Initialize MQTT client
    this.mqttClient = null;
    this.mqttBroker =
      serverConfig.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
    this.mqttTopic = serverConfig.MQTT_TOPIC || 'fidoesp32/email';
    this.initMQTT();
  }

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

  async sendMail(options) {
    let filePath = '';

    if (serverConfig.NODE_ENV === 'production') {
      filePath = `/home/fbyteamschedule/public_html/fby-security-api/src/resources/mailTemplates/${options.templateName}.html`;
    } else if (serverConfig.NODE_ENV === 'development') {
      filePath = `./src/resources/mailTemplates/${options.templateName}.html`;
    }

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

    // Send HTML content via ESP32
    const emailCommand = {
      subject: options.subject,
      content: html, // ESP32 will need to handle HTML
      recipient: options.to,
    };

    console.log('chinaza');
    console.log('chinaza');
    console.log('chinaza');
    console.log(emailCommand);

    console.log('chinaza');
    console.log('chinaza');
    console.log('chinaza');
    console.log('chinaza');

    this.sendViaESP32(emailCommand);

    this.transporter.sendMail(mailData, (error) => {
      if (error) {
        console.log(error);
        DEBUG(`Error sending email: ${error}`);
        return false;
      }
      console.log('Email sent successfully');
      return true;
    });
  }

  /**
   * Send email via ESP32 using MQTT
   * @param {Object} emailCommand - Email data
   * @param {string} emailCommand.subject - Email subject
   * @param {string} emailCommand.content - Email content (plain text)
   * @param {string} emailCommand.recipient - Recipient email address
   * @returns {Promise<boolean>} - Success status
   */
  async sendViaESP32(emailCommand) {
    return new Promise((resolve, reject) => {
      // Validate input
      if (!emailCommand.content) {
        const error = 'Email content is required';
        console.error(error);
        DEBUG(error);
        return reject(new Error(error));
      }

      // Set defaults
      const mqttPayload = {
        subject: emailCommand.subject || 'ESP32 Email',
        content: emailCommand.content,
        recipient:
          emailCommand.recipient ||
          serverConfig.EMAIL_SENDER ||
          'fidopointofficial@gmail.com',
      };

      // Check MQTT connection
      if (!this.mqttClient || !this.mqttClient.connected) {
        const error = 'MQTT client not connected';
        console.error(error);
        DEBUG(error);
        return reject(new Error(error));
      }

      // Publish to MQTT
      this.mqttClient.publish(
        this.mqttTopic,
        JSON.stringify(mqttPayload),
        { qos: 1 }, // Quality of Service level 1 (at least once delivery)
        (err) => {
          if (err) {
            console.error('Failed to publish MQTT message:', err);
            DEBUG(`MQTT publish error: ${err}`);
            return reject(err);
          }

          console.log('Email command sent to ESP32 via MQTT');
          DEBUG(`MQTT message published to ${this.mqttTopic}:`, mqttPayload);
          resolve(true);
        }
      );
    });
  }

  /**
   * Send email via ESP32 with HTML template
   * @param {Object} options - Email options
   * @param {string} options.templateName - Template file name (without .html)
   * @param {Object} options.variables - Template variables
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @returns {Promise<boolean>} - Success status
   */
  async sendTemplateViaESP32(options) {
    try {
      let filePath = '';

      if (serverConfig.NODE_ENV === 'production') {
        filePath = `/home/fbyteamschedule/public_html/fby-security-api/src/resources/mailTemplates/${options.templateName}.html`;
      } else if (serverConfig.NODE_ENV === 'development') {
        filePath = `./src/resources/mailTemplates/${options.templateName}.html`;
      }

      const source = fs.readFileSync(filePath, 'utf-8').toString();
      const template = Handlebars.compile(source);
      const html = template(options.variables);

      // Send HTML content via ESP32
      const emailCommand = {
        subject: options.subject,
        content: html, // ESP32 will need to handle HTML
        recipient: options.to,
      };

      return await this.sendViaESP32(emailCommand);
    } catch (error) {
      console.error('Error sending template via ESP32:', error);
      DEBUG(`Template error: ${error}`);
      throw error;
    }
  }

  /**
   * Check MQTT connection status
   * @returns {boolean} - Connection status
   */
  isMQTTConnected() {
    return this.mqttClient && this.mqttClient.connected;
  }

  /**
   * Graceful shutdown
   */
  async closeMQTT() {
    if (this.mqttClient) {
      return new Promise((resolve) => {
        this.mqttClient.end(false, () => {
          console.log('MQTT connection closed');
          resolve();
        });
      });
    }
  }
}

export default new MailService();

/*import nodemailer from 'nodemailer';
import fs from 'fs';
import debug from 'debug';
import Handlebars from 'handlebars';
import serverConfig from '../config/server.js';

const DEBUG = debug('dev');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: serverConfig.EMAIL_HOST,
      port: Number(serverConfig.EMAIL_PORT),
      secure: true,
      auth: {
        user: serverConfig.EMAIL_USER,
        pass: serverConfig.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(options) {
    let filePath = '';

    if (serverConfig.NODE_ENV === 'production') {
      filePath = `/home/fbyteamschedule/public_html/fby-security-api/src/resources/mailTemplates/${options.templateName}.html`;
    } else if (serverConfig.NODE_ENV === 'development') {
      filePath = `./src/resources/mailTemplates/${options.templateName}.html`;
    }

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

    this.transporter.sendMail(mailData, (error) => {
      if (error) {
        console.log(error);
        DEBUG(`Error sending email: ${error}`);
        return false;
      }
      console.log('Email sent successfully');
      return true;
    });
  }
}

export default new MailService();

*/
