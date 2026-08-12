import { db } from '../../config/database.js';
import { integrations } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { EvolutionService } from '../../services/evolution.service.js';

export class IntegrationsService {
  private static formatIntegration(row: typeof integrations.$inferSelect) {
    return {
      id: row.id,
      name: row.name,
      type: row.type as
        | 'whatsapp'
        | 'openrouter'
        | 'n8n'
        | 'postgresql'
        | 'redis'
        | 'openai',
      status: (row.status || 'disconnected') as
        | 'connected'
        | 'disconnected'
        | 'error',
      config: (row.config || {}) as Record<string, unknown>,
      last_synced_at: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
    };
  }

  static async list() {
    const rows = await db.select().from(integrations);
    return rows.map((r) => this.formatIntegration(r));
  }

  static async refresh(id: string) {
    const integration = await db.query.integrations.findFirst({
      where: eq(integrations.id, id),
    });

    if (!integration) return null;

    let status: 'connected' | 'disconnected' | 'error' = 'connected';

    if (integration.type === 'whatsapp') {
      const evoRes = await EvolutionService.fetchInstances();
      status = evoRes ? 'connected' : 'disconnected';
    }

    const [updated] = await db
      .update(integrations)
      .set({
        status,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, id))
      .returning();

    return this.formatIntegration(updated);
  }
}
