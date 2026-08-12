import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse, ApiError } from '../utils/api-response.js';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ApiError[] = error.errors.map((err) => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.'),
        }));
        return ApiResponse.error(res, errors, 400);
      }
      return ApiResponse.error(
        res,
        { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        400
      );
    }
  };
};
