import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { auditLogs } from '../../drizzle/schema.js';
import { logger } from '../utils/logger.js';

export const auditLog = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Intercept res.json to log after successful response
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.sub) {
        db.insert(auditLogs)
          .values({
            adminId: req.user.sub,
            action,
            entityType,
            entityId: req.params.id || body?.data?.id || null,
            afterData: body?.data || null,
            ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
            userAgent: req.get('user-agent') || null,
          })
          .catch((err) => {
            logger.error('Failed to create audit log:', err);
          });
      }
      return originalJson.call(this, body);
    };
    next();
  };
};
