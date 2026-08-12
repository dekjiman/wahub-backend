"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const evolution_service_js_1 = require("../../services/evolution.service.js");
class IntegrationsService {
    static formatIntegration(row) {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            status: (row.status || 'disconnected'),
            config: (row.config || {}),
            last_synced_at: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
        };
    }
    static async list() {
        const rows = await database_js_1.db.select().from(schema_js_1.integrations);
        return rows.map((r) => this.formatIntegration(r));
    }
    static async refresh(id) {
        const integration = await database_js_1.db.query.integrations.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.integrations.id, id),
        });
        if (!integration)
            return null;
        let status = 'connected';
        if (integration.type === 'whatsapp') {
            const evoRes = await evolution_service_js_1.EvolutionService.fetchInstances();
            status = evoRes ? 'connected' : 'disconnected';
        }
        const [updated] = await database_js_1.db
            .update(schema_js_1.integrations)
            .set({
            status,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.integrations.id, id))
            .returning();
        return this.formatIntegration(updated);
    }
}
exports.IntegrationsService = IntegrationsService;
