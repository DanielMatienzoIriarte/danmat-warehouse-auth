import Fastify, { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { redisClient } from './config/redis.js';
import { authRoutes } from './routes/auth.routes.js';

dotenv.config();

const server: FastifyInstance = Fastify({ logger:true });

async function buildServer() {
  // Register cookie plugin with type augmentation support
  await server.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'super_secret_cookie_key',
  });

  // Register auth routes
  await server.register(authRoutes);

  server.get('/health', async (req, reply) => {
    const dbState = mongoose.connection.readyState; // 1 = connected

    let redisStatus = 'disconnected';

    try {
      const pong = await redisClient.ping();
      if (pong === 'PONG') {
        redisStatus = 'connected';
      }
    } catch (error) {
      redisStatus = 'error';
    }

    const isHealthy = dbState === 1 && redisStatus === 'connected';
    const statusCode = isHealthy ? 200 : 530;

    return reply.code(statusCode).send({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      services: {
        mongodb: dbState === 1 ? 'connected' : 'disconnected',
        redis: redisStatus,
      },
    });
  });
}

const start = async() => {
  try {
    await connectDB();
    await buildServer();

    const port = Number(process.env.PORT) || 4001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Auth service running on port ${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

start();