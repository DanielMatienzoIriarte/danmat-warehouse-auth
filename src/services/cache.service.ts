import { redisClient } from '../config/redis.js';
import { ICacheService } from './auth.service.interface.js';

export class RedisCacheService implements ICacheService {
  async setSession(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redisClient.set(key, value, 'EX', ttlSeconds);
  }

  async getSession(key: string): Promise<string | null> {
    return await redisClient.get(key);
  }

  async deleteSession(key: string): Promise<number> {
    return await redisClient.del(key);
  }
}