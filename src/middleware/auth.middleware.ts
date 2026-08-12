import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { ApiResponse } from '../utils/api-response.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(
      res,
      { code: 'UNAUTHORIZED', message: 'Missing or invalid token' },
      401
    );
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return ApiResponse.error(
      res,
      { code: 'UNAUTHORIZED', message: 'Token expired or invalid' },
      401
    );
  }
};
