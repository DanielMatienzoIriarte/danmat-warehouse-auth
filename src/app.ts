import Fastify, { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import { authRoutes } from './routes/auth.routes.js';
import { servicesPlugin } from './plugins/services.plugin.js';
import { redisClient } from './config/redis.js';

export async function buildServer(): Promise<FastifyInstance> {
  const app: FastifyInstance = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  });

  //Register Core Plugins
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'super_secret_cookie_key',
  });

  //Register Services applying Composition Roots via Decorators.
  await app.register(servicesPlugin);

  //Register Application Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  //Register rate-limiter
  await app.register(fastifyRateLimit, {
    global: false, // Apply selectively to protect routes
    max: 5,
    timeWindow: '1 minute',
  });

  //Regsiter Helmet to secure headers
  await app.register(fastifyHelmet);

  app.get('/health', async (req, reply) => {
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
      timestamp: new Date().toISOString(),
      services: {
        mongodb: dbState === 1 ? 'connected' : 'disconnected',
        redis: redisStatus,
      },
    });
  });

  // 3. Global Error Handler (OWASP / Production Best Practice)
  app.setErrorHandler((error:any, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' && statusCode === 500 
          ? 'Internal Server Error' 
          : error.message,
      },
    });
  });

  return app;
}