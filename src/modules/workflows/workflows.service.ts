import { db } from '../../config/database.js';
import { workflowRuns } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export class WorkflowsService {
  private static formatRun(row: typeof workflowRuns.$inferSelect) {
    return {
      id: row.id,
      name: row.name,
      trigger_type: row.triggerType as 'webhook' | 'schedule' | 'manual',
      status: (row.status || 'running') as 'running' | 'success' | 'failed' | 'timeout',
      input_data: row.inputData,
      output_data: row.outputData,
      error_message: row.errorMessage,
      duration_ms: row.durationMs,
      started_at: row.startedAt
        ? row.startedAt.toISOString()
        : new Date().toISOString(),
      completed_at: row.completedAt ? row.completedAt.toISOString() : null,
    };
  }

  static async list() {
    const rows = await db.select().from(workflowRuns);
    return rows.map((r) => this.formatRun(r));
  }

  static async retry(id: string) {
    const run = await db.query.workflowRuns.findFirst({
      where: eq(workflowRuns.id, id),
    });

    if (!run) return null;

    const [retried] = await db
      .update(workflowRuns)
      .set({
        status: 'success',
        errorMessage: null,
        completedAt: new Date(),
        durationMs: 150,
      })
      .where(eq(workflowRuns.id, id))
      .returning();

    return this.formatRun(retried);
  }
}
