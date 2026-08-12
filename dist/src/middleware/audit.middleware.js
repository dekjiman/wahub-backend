"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const database_js_1 = require("../config/database.js");
const schema_js_1 = require("../../drizzle/schema.js");
const logger_js_1 = require("../utils/logger.js");
const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        // Intercept res.json to log after successful response
        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.sub) {
                database_js_1.db.insert(schema_js_1.auditLogs)
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
                    logger_js_1.logger.error('Failed to create audit log:', err);
                });
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.auditLog = auditLog;
