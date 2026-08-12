import { db } from '../../config/database.js';
import {
  communities,
  groups,
  members,
  chatLogs,
  moderationAlerts,
  escalations,
  auditLogs,
  admins,
  integrations,
} from '../../../drizzle/schema.js';
import { sql, eq } from 'drizzle-orm';
import { isRedisConnected } from '../../config/redis.js';
import { EvolutionService } from '../../services/evolution.service.js';

export class DashboardService {
  static async getSummary() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [comCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communities);
    const [grpCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groups);
    const [memCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(members);

    const [aiGrpCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groups)
      .where(eq(groups.aiEnabled, true));

    const [msgToday] = await db
      .select({ sum: sql<number>`coalesce(sum(${groups.messageCountToday}), 0)` })
      .from(groups);

    const [newMemToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(sql`${members.createdAt} >= ${todayStart.toISOString()}`);

    const [pendingMod] = await db
      .select({ count: sql<number>`count(*)` })
      .from(moderationAlerts)
      .where(sql`${moderationAlerts.status} IN ('pending', 'open', 'under_review')`);

    const [openEsc] = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalations)
      .where(sql`${escalations.status} IN ('open', 'in_progress')`);

    const [urgentEsc] = await db
      .select({ count: sql<number>`count(*)` })
      .from(escalations)
      .where(sql`${escalations.status} IN ('open', 'in_progress') AND ${escalations.priority} = 'urgent'`);

    return {
      groups_active: Number(grpCount?.count || 0),
      total_groups: Number(grpCount?.count || 0),
      total_communities: Number(comCount?.count || 0),
      total_members: Number(memCount?.count || 0),
      members_new_today: Number(newMemToday?.count || 0),
      messages_today: Number(msgToday?.sum || 0),
      spam_detected_today: 0,
      negative_sentiment_today: 0,
      tickets_open: Number(openEsc?.count || 0),
      tickets_urgent: Number(urgentEsc?.count || 0),
      active_ai_groups: Number(aiGrpCount?.count || 0),
      broadcasts_active: 0,
      workflow_failures: 0,
    };
  }

  static async getHealth() {
    const now = new Date().toISOString();

    // Check DB
    let dbStatus: 'healthy' | 'down' = 'healthy';
    let dbDetails = 'PostgreSQL is connected';
    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbStatus = 'down';
      dbDetails = 'PostgreSQL connection failed';
    }

    // Check Redis
    const redisStatus = isRedisConnected ? 'healthy' : 'degraded';
    const redisDetails = isRedisConnected
      ? 'Redis cache operational'
      : 'Redis disconnected (operating with fallbacks)';

    // Check Evolution API
    let evoStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    let evoDetails = 'Evolution API online';
    const evoRes = await EvolutionService.fetchInstances();
    if (!evoRes) {
      evoStatus = 'degraded';
      evoDetails = 'Evolution API gateway unreachable';
    }

    return [
      {
        service: 'Database (PostgreSQL)',
        label: 'PostgreSQL',
        status: dbStatus,
        latency_ms: dbStatus === 'healthy' ? 8 : 9999,
        checked_at: now,
        details: dbDetails,
      },
      {
        service: 'Cache (Redis)',
        label: 'Redis',
        status: redisStatus,
        latency_ms: isRedisConnected ? 2 : 9999,
        checked_at: now,
        details: redisDetails,
      },
      {
        service: 'WhatsApp Gateway (Evolution API)',
        label: 'Evolution API',
        status: evoStatus,
        latency_ms: evoStatus === 'healthy' ? 42 : 9999,
        checked_at: now,
        details: evoDetails,
      },
    ];
  }

  static async getRecentActivities() {
    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        actorName: admins.name,
        actorEmail: admins.email,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(admins, eq(auditLogs.adminId, admins.id))
      .limit(20);

    return rows.map((r) => ({
      id: r.id,
      type: r.entityType || 'system',
      title: `${r.action} ${r.entityType}`,
      description: `${r.actorName || r.actorEmail || 'System'} performed ${r.action} on ${r.entityType}`,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));
  }
}
