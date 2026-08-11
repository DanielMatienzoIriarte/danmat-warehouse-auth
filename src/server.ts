import mongoose from 'mongoose';
import { redisClient } from './config/redis.js';
import { buildServer } from './app.js';

const PORT = Number(process.env.PORT) || 4001;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const server = await buildServer();

  try {
    // 1. Initialize External Infrastructure
    server.log.info('Connecting to MongoDB and Redis...');
    await mongoose.connect(process.env.MONGO_URI!);

    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }

    server.log.info('Infrastructure connected successfully.');

    // 2. Start Listening
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Auth microservice running on http://${HOST}:${PORT}`);

    // 3. Graceful Shutdown Handler
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        server.log.info(`Received ${signal}. Initiating graceful shutdown...`);
        try {
          await server.close();
          await redisClient.quit();
          await mongoose.connection.close(false);
          server.log.info('All connections closed cleanly. Exiting process.');
          process.exit(0);
        } catch (err) {
          server.log.error({ err }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });
    }
  } catch (err) {
    server.log.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();