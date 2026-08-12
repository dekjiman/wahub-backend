"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class WorkflowsService {
    static formatRun(row) {
        return {
            id: row.id,
            name: row.name,
            trigger_type: row.triggerType,
            status: (row.status || 'running'),
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
        const rows = await database_js_1.db.select().from(schema_js_1.workflowRuns);
        return rows.map((r) => this.formatRun(r));
    }
    static async retry(id) {
        const run = await database_js_1.db.query.workflowRuns.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.workflowRuns.id, id),
        });
        if (!run)
            return null;
        const [retried] = await database_js_1.db
            .update(schema_js_1.workflowRuns)
            .set({
            status: 'success',
            errorMessage: null,
            completedAt: new Date(),
            durationMs: 150,
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.workflowRuns.id, id))
            .returning();
        return this.formatRun(retried);
    }
}
exports.WorkflowsService = WorkflowsService;
