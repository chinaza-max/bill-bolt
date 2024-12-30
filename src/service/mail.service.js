import nodemailer from 'nodemailer';
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
