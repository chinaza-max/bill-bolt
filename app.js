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
import { Setting, Admin, Transaction } from './src/db/models/index.js';
import { Server as SocketIOServer } from 'socket.io';
import { configureSocket } from './src/utils/socketUtils.js';
import userService from './src/service/user.service.js';
import authService from './src/service/auth.service.js';

import http from 'http';

//import {  Op } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Server {
  constructor(port, mode) {
    this.port = port;
    this.mode = mode;
    this.app = express();
    this.initializeDbAndFirebase();
    this.initializeMiddlewaresAndRoutes();
    this.loadCronJobs();
    this.httpServer = http.createServer(this.app);
    this.setupSocket();
  }

  async initializeDbAndFirebase() {
    await DB.connectDB();
    const [setting, created] = await Setting.findOrCreate({
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
          { amount: 10000, charge: 500 },
        ],

        serviceCharge: [
          { amount: 1000, charge: 20 },
          { amount: 5000, charge: 45 },
          { amount: 10000, charge: 80 },
        ],
        gatewayService: [
          { amount: 1000, charge: 10 },
          { amount: 5000, charge: 25 },
          { amount: 10000, charge: 40 },
        ],
        gatewayList: ['safeHaven.gateway'],
        isDeleted: false,
      },
    });
    if (!setting.serviceCharge || !setting.gatewayService) {
      await setting.update({
        serviceCharge: setting.serviceCharge ?? [
          { amount: 1000, charge: 20 },
          { amount: 5000, charge: 45 },
          { amount: 10000, charge: 80 },
        ],
        gatewayService: setting.gatewayService ?? [
          { amount: 1000, charge: 10 },
          { amount: 5000, charge: 25 },
          { amount: 10000, charge: 40 },
        ],
      });
    }

    await Admin.findOrCreate({
      where: { emailAddress: 'admin3@gmail.com' },
      defaults: {
        firstName: 'Admin',
        lastName: 'Admin',
        isEmailValid: true,
        password: serverConfig.ADMIN_PASSWORD, // Ensure this password is securely hashed
        image:
          'https://res.cloudinary.com/dvznn9s4g/image/upload/v1740438988/avatar_phzyrn.jpg',
        role: 'admin',
        privilege: 'super_admin',
      },
    });
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
        credentials: true,
      };
    } else {
      corsOptions = {
        origin: '*',
        credentials: true,
      };
    }

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(cors(corsOptions));
    //this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    this.app.use(cookieParser());
    // const httpServer = http.createServer(this.app);
    //
    this.app.use(routes);
    this.app.use(systemMiddleware.errorHandler);
  }
  setupSocket() {
    const io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    configureSocket(io);
    /* io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      socket.on('joinRoom', async ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: room-${roomId}`);
      });

      socket.on('message', async ({ roomId, senderType, content }) => {
        const message = await Service.saveMessage(roomId, senderType, content);
        io.to(`${roomId}`).emit('message', message);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });*/
  }
  loadCronJobs() {
    cron.schedule('*/10  * * * * *', async () => {
      userService.makeMatch();
    });

    cron.schedule('*/2 * * * *', async () => {
      // this.checkTransaction();
    });
  }
  async checkTransaction() {
    const dummyPayload = {
      type: 'transfer',
      data: {
        // This object will be filled per transaction
      },
    };

    try {
      // 1. Retrieve all pending transactions
      const pendingTransactions = await Transaction.findAll({
        where: {
          paymentStatus: 'pending',
          isDeleted: false,
        },
      });

      for (const tx of pendingTransactions) {
        // 2. Build payload for each transaction
        const updatedPayload = {
          ...dummyPayload,
          data: {
            ...dummyPayload.data,
            sessionId: tx.sessionIdVirtualAcct,
            amount: tx.amount,
            paymentReference: tx.paymentReference,
            status: 'Completed',
          },
        };

        authService.handleVirtualAccountCollection(updatedPayload);
      }

      console.log(
        `[${new Date().toISOString()}] Processed ${
          pendingTransactions.length
        } pending transactions`
      );
    } catch (error) {
      console.error('Error processing pending transactions:', error);
    }
  }
  start() {
    this.httpServer.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

const server = new Server(serverConfig.PORT, serverConfig.NODE_ENV);
server.start();
//admin100