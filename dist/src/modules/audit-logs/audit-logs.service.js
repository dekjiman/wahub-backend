"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class AuditLogsService {
    static async list() {
        const rows = await database_js_1.db
            .select({
            log: schema_js_1.auditLogs,
            adminName: schema_js_1.admins.name,
        })
            .from(schema_js_1.auditLogs)
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.auditLogs.adminId, schema_js_1.admins.id));
        return rows.map((r) => ({
            id: r.log.id,
            admin_id: r.log.adminId || '',
            admin_name: r.adminName || 'System',
            action: r.log.action,
            entity_type: r.log.entityType,
            entity_id: r.log.entityId,
            before_data: r.log.beforeData,
            after_data: r.log.afterData,
            ip_address: r.log.ipAddress,
            created_at: r.log.createdAt
                ? r.log.createdAt.toISOString()
                : new Date().toISOString(),
        }));
    }
}
exports.AuditLogsService = AuditLogsService;
