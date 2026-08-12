"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const logger_js_1 = require("../utils/logger.js");
class NotificationService {
    static async notifyAdmins(event, payload) {
        logger_js_1.logger.info(`[Notification] ${event}:`, payload);
        // In production, this can send webhooks or push notifications to admins
    }
}
exports.NotificationService = NotificationService;
