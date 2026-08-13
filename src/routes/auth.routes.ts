import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { UserRepository } from '../repositories/mongo-user.repository';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Composition root initialization
  const userRepository = new UserRepository();
  const authService = new AuthService(
    userRepository,
    server.hasher,
    server.tokenService,
    server.cacheService
  );

  const registerSchema = {
    body: {
      type: 'object',
      required: ['email', 'password', 'full_name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 32 },
        full_name: { type: 'string', minLength: 2, maxLength: 150 },
      },
      additionalProperties: false, // Rejects unexpected payload fields for security
    },
  };

  const loginSchema  = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 32 },
      },
    },
  };

  const refreshSchema = {
    // Example if passing the token in the body:
    body: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', minLength: 10 },
      },
      additionalProperties: false,
    },
  };

  const logoutSchema = {
    // If your logout requires confirming the refresh token to revoke it:
    body: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string' },
      },
      additionalProperties: false,
    },
  };

  const authController = new AuthController(authService);

  server.post('/api/auth/register',
    {
      schema: registerSchema,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    authController.register);

    server.post('/api/auth/login',
    {
      schema: loginSchema,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    authController.login);

    server.post('/api/auth/refresh',
    {
      schema: refreshSchema,
    },
    authController.refresh);

    server.post('/api/auth/logout',
    {
      schema: logoutSchema,
    },
    authController.logout);

    server.get('/api/auth/public-key', authController.getPublicKey);
}