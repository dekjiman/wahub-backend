import { db } from '../../config/database.js';
import { auditLogs, admins } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export class AuditLogsService {
  static async list() {
    const rows = await db
      .select({
        log: auditLogs,
        adminName: admins.name,
      })
      .from(auditLogs)
      .leftJoin(admins, eq(auditLogs.adminId, admins.id));

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
