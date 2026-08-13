import 'fastify';
import { IPasswordHasher, ITokenService, ICacheService } from '../services/auth.service.interface.js';

declare module 'fastify' {
  interface FastifyInstance {
    hasher: IPasswordHasher;
    tokenService: ITokenService;
    cacheService: ICacheService;
  }
}