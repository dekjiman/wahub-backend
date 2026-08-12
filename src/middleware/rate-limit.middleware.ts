import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response.js';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

// Clean up expired IP keys periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

export const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In vitest/test environment, bypass rate limit so test suites run smoothly
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return ApiResponse.error(
        res,
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        },
        429
      );
    }

    next();
  };
};

export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 20); // 20 login attempts per 15 min
export const apiRateLimiter = createRateLimiter(1 * 60 * 1000, 300); // 300 requests per 1 min
