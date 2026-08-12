import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response.js';
import { env } from '../config/env.js';

export const internalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : (req.headers['x-internal-token'] as string);

  const validToken = env.N8N_INTERNAL_TOKEN;

  if (!headerToken || headerToken !== validToken) {
    return ApiResponse.error(
      res,
      { code: 'UNAUTHORIZED', message: 'Missing or invalid internal service token' },
      401
    );
  }

  next();
};
