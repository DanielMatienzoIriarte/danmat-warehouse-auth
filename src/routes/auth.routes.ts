import { FastifyInstance } from 'fastify';
import { UserRepository } from '../repositories/mongo-user.repository.js';
import { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';

export async function authRoutes(server: FastifyInstance) {
  // Composition root initialization
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  server.post('/api/auth/register', authController.register);
  server.post('/api/auth/login', authController.login);
  server.post('/api/auth/refresh', authController.refresh);
  server.post('/api/auth/logout', authController.logout);
  server.get('/api/auth/public-key', authController.getPublicKey);
}