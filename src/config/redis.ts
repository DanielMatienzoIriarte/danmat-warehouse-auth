import Redis from "ioredis";

const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = new Redis(redisURL);

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});