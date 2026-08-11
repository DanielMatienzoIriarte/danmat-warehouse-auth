import { FastifyInstance } from 'fastify';
import { UserRepository } from '../repositories/mongo-user.repository';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { BcryptPasswordHasher } from '../services/bcrypt.service';
import { JwtTokenService } from '../services/token.service';
import { RedisCacheService } from '../services/cache.service';

export async function authRoutes(server: FastifyInstance) {
  // Composition root initialization
  const userRepository = new UserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const cacheService = new RedisCacheService();
  const authService = new AuthService(userRepository, passwordHasher, tokenService, cacheService);
  const authController = new AuthController(authService);

  server.post('/api/auth/register', authController.register);
  server.post('/api/auth/login', authController.login);
  server.post('/api/auth/refresh', authController.refresh);
  server.post('/api/auth/logout', authController.logout);
  server.get('/api/auth/public-key', authController.getPublicKey);
}