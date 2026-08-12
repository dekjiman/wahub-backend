import winston from 'winston';

const sanitizeFormat = winston.format((info) => {
  if (typeof info === 'object' && info !== null) {
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'api_key', 'apikey'];
    for (const key of Object.keys(info)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        info[key] = '[REDACTED]';
      }
    }
  }
  return info;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

