import fp from 'fastify-plugin';
import { BcryptPasswordHasher } from '../services/bcrypt.service';
import { JwtTokenService } from '../services/token.service';
import { RedisCacheService } from '../services/cache.service';
import { redisClient } from '../config/redis.js';

export const servicesPlugin = fp(async (fastify) => {
  // 1. Validate environment configuration at boot (Fail-Fast)
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error('Fatal Configuration Error: Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET.');
  }

  // 2. Instantiate dependencies explicitly
  const hasher = new BcryptPasswordHasher(12);
  
  const tokenService = new JwtTokenService({
    accessSecret,
    refreshSecret,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  });

  const cacheService = new RedisCacheService(redisClient);

  // 3. Bind to Fastify instance decorators
  fastify.decorate('hasher', hasher);
  fastify.decorate('tokenService', tokenService);
  fastify.decorate('cacheService', cacheService);

  fastify.log.info('Domain services successfully instantiated and registered.');
});