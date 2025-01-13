import express from 'express';
import cors from 'cors';
import routes from './src/routes/index.route.js';
import DB from './src/db/index.js';
import serverConfig from './src/config/server.js';
import systemMiddleware from './src/middlewares/system.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cron from 'node-cron';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import cookieParser from 'cookie-parser';
import { Setting, Admin } from './src/db/models/index.js';
import { Server as SocketIOServer } from 'socket.io';
import { configureSocket } from './src/utils/socketUtils.js';
import http from 'http';

//import {  Op } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Fintread API',
      version: '1.0.0',
      description: 'API documentation for your system',
    },
    servers: [
      {
        url: `${serverConfig.DOMAIN}/api/v1/`,
        description: 'live server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/**/*.js'], // Define where your route/controller files are located
};
//        url: `http://localhost:${serverConfig.PORT}/api/v1/`, // Your base URL
//      url: `${serverConfig.DOMAIN}/api/v1/`, // Your base URL

const swaggerDocs = swaggerJsDoc(swaggerOptions);

class Server {
  constructor(port, mode) {
    this.port = port;
    this.mode = mode;
    this.app = express();
    this.initializeDbAndFirebase();
    this.initializeMiddlewaresAndRoutes();
  }

  async initializeDbAndFirebase() {
    await DB.connectDB();
    await Setting.findOrCreate({
      where: { id: 1 },
      defaults: {
        distanceThreshold: 10,
        tiers: [
          {
            name: 'bronze',
            maxAmount: 10000,
            maxTransfersPerDay: 5,
            uniqueNumber: 1,
            country: 'NIGERIA',
          },
          {
            name: 'silver',
            maxAmount: 50000,
            maxTransfersPerDay: 10,
            uniqueNumber: 2,
            country: 'NIGERIA',
          },
          {
            name: 'gold',
            maxAmount: 100000,
            maxTransfersPerDay: 20,
            uniqueNumber: 3,
            country: 'NIGERIA',
          },
        ],
        gateWayEnvironment: 'sandBox',
        activeGateway: 'safeHaven.gateway',
        isMatchRunning: false,
        defaultAds: [
          { amount: 1000, charge: 100 },
          { amount: 5000, charge: 300 },
          { amount: 20000, charge: 500 },
          { amount: 30000, charge: 1000 },
        ],
        gatewayList: ['safeHaven.gateway'],
        isDeleted: false,
      },
    });
    /* await Admin.findOrCreate({
      where: { emailAddress: 'admin@gmail.com' },
      defaults: {
        firstName: 'Admin',
        lastName: 'Admin',
        password: serverConfig.ADMIN_PASSWORD, // Ensure this password is securely hashed
        image: null,
        role: 'admin',
        privilege: 'super_admin',
      },
    });*/
    //cron.schedule('0 */2 * * *', async () => {
    /* checktransactionUpdateWebHook
        checktransactionUpdateSingleTransfer
      })*/
  }

  initializeMiddlewaresAndRoutes() {
    let corsOptions;
    if (this.mode == 'production') {
      const allowedOrigins = ['http://example.com']; // Add your allowed origin(s) here

      corsOptions = {
        origin: function (origin, callback) {
          // Check if the origin is in the allowedOrigins array
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
      };
    } else {
      corsOptions = {
        origin: '*',
      };
    }

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(cors(corsOptions));
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    this.app.use(cookieParser());

    this.app.use(routes);
    this.app.use(systemMiddleware.errorHandler);
    const httpServer = http.createServer(this.app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    configureSocket(io);
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

const server = new Server(serverConfig.PORT, serverConfig.NODE_ENV);
server.start();
