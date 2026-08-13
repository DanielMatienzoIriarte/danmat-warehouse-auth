import { Redis } from 'ioredis';
import { ICacheService } from './auth.service.interface.js';

export class RedisCacheService implements ICacheService {
  constructor(private readonly redisClient: Redis) {}

  async setSession(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redisClient.set(key, value, 'EX', ttlSeconds);
  }

  async getSession(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async deleteSession(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }
}