import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return ApiResponse.error(
    res,
    {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
    },
    statusCode
  );
};
