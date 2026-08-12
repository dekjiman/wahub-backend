"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const redis_js_1 = require("../../config/redis.js");
const evolution_service_js_1 = require("../../services/evolution.service.js");
class DashboardService {
    static async getSummary() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [comCount] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.communities);
        const [grpCount] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.groups);
        const [memCount] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.members);
        const [aiGrpCount] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.groups)
            .where((0, drizzle_orm_1.eq)(schema_js_1.groups.aiEnabled, true));
        const [msgToday] = await database_js_1.db
            .select({ sum: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_js_1.groups.messageCountToday}), 0)` })
            .from(schema_js_1.groups);
        const [newMemToday] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.members)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.members.createdAt} >= ${todayStart.toISOString()}`);
        const [pendingMod] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.moderationAlerts)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.moderationAlerts.status} IN ('pending', 'open', 'under_review')`);
        const [openEsc] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.escalations)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.escalations.status} IN ('open', 'in_progress')`);
        const [urgentEsc] = await database_js_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_js_1.escalations)
            .where((0, drizzle_orm_1.sql) `${schema_js_1.escalations.status} IN ('open', 'in_progress') AND ${schema_js_1.escalations.priority} = 'urgent'`);
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
        let dbStatus = 'healthy';
        let dbDetails = 'PostgreSQL is connected';
        try {
            await database_js_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
        }
        catch {
            dbStatus = 'down';
            dbDetails = 'PostgreSQL connection failed';
        }
        // Check Redis
        const redisStatus = redis_js_1.isRedisConnected ? 'healthy' : 'degraded';
        const redisDetails = redis_js_1.isRedisConnected
            ? 'Redis cache operational'
            : 'Redis disconnected (operating with fallbacks)';
        // Check Evolution API
        let evoStatus = 'healthy';
        let evoDetails = 'Evolution API online';
        const evoRes = await evolution_service_js_1.EvolutionService.fetchInstances();
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
                latency_ms: redis_js_1.isRedisConnected ? 2 : 9999,
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
        const rows = await database_js_1.db
            .select({
            id: schema_js_1.auditLogs.id,
            action: schema_js_1.auditLogs.action,
            entityType: schema_js_1.auditLogs.entityType,
            actorName: schema_js_1.admins.name,
            actorEmail: schema_js_1.admins.email,
            createdAt: schema_js_1.auditLogs.createdAt,
        })
            .from(schema_js_1.auditLogs)
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.auditLogs.adminId, schema_js_1.admins.id))
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
exports.DashboardService = DashboardService;
