import Redis from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 100, 2000);
    },
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
  });
} catch (error) {
  isRedisConnected = false;
}

export const getRedisClient = (): Redis | null => {
  return isRedisConnected ? redisClient : null;
};

export { redisClient, isRedisConnected };
