import jwt from 'jsonwebtoken';
import serverConfig from '../config/server.js';
import IdentityClient from '../db/models/identityClient.js';
import { UnAuthorizedError, BadRequestError } from '../errors/index.js';

class IdentityAuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['api-key'];
      const { authorization } = req.headers;
      const isInternal = req.headers['x-internal-service'] === 'true' || req.headers['x-internal-service'] === true;

      if (isInternal) {
        req.isInternal = true;
        return next();
      }

      let client = null;

      if (apiKey) {
        client = await IdentityClient.findOne({
          where: { apiKey, isDeleted: false },
        });

        if (!client) {
          throw new UnAuthorizedError('Invalid API Key provided.');
        }

        if (client.status !== 'active') {
          throw new UnAuthorizedError('Identity account is inactive or suspended.');
        }
      } else if (authorization && authorization.startsWith('Bearer ')) {
        const token = authorization.split(' ')[1];
        if (!token) throw new BadRequestError('No authentication token provided.');

        let decoded;
        try {
          decoded = jwt.verify(token, serverConfig.ACCESS_TOKEN_SECRET);
        } catch (err) {
          throw new UnAuthorizedError('Invalid or expired authentication token.');
        }

        if (!decoded || !decoded.identityClientId) {
          throw new UnAuthorizedError('Invalid token payload for identity client.');
        }

        client = await IdentityClient.findOne({
          where: { id: decoded.identityClientId, isDeleted: false },
        });

        if (!client) {
          throw new UnAuthorizedError('Identity client account not found.');
        }

        if (client.status !== 'active') {
          throw new UnAuthorizedError('Identity account is inactive or suspended.');
        }
      } else {
        throw new UnAuthorizedError('Authentication required. Provide x-api-key header or Bearer Token.');
      }

      req.identityClient = client;
      req.isInternal = false;
      return next();
    } catch (error) {
      console.error('[IdentityAuthMiddleware] Auth error:', error.message);
      next(error);
    }
  }

  async optionalAuthenticate(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['api-key'];
      const { authorization } = req.headers;
      const isInternal = req.headers['x-internal-service'] === 'true' || req.headers['x-internal-service'] === true;

      if (isInternal) {
        req.isInternal = true;
        return next();
      }

      if (apiKey) {
        const client = await IdentityClient.findOne({
          where: { apiKey, isDeleted: false },
        });
        if (client && client.status === 'active') {
          req.identityClient = client;
        }
      } else if (authorization && authorization.startsWith('Bearer ')) {
        const token = authorization.split(' ')[1];
        try {
          const decoded = jwt.verify(token, serverConfig.ACCESS_TOKEN_SECRET);
          if (decoded && decoded.identityClientId) {
            const client = await IdentityClient.findOne({
              where: { id: decoded.identityClientId, isDeleted: false },
            });
            if (client && client.status === 'active') {
              req.identityClient = client;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      return next();
    } catch (error) {
      next(error);
    }
  }
}

export default new IdentityAuthMiddleware();
