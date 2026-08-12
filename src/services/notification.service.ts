import { logger } from '../utils/logger.js';

export class NotificationService {
  static async notifyAdmins(event: string, payload: any) {
    logger.info(`[Notification] ${event}:`, payload);
    // In production, this can send webhooks or push notifications to admins
  }
}
