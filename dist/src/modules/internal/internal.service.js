"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const env_js_1 = require("../../config/env.js");
class InternalService {
    static async getEventById(eventId) {
        const [event] = await database_js_1.db
            .select()
            .from(schema_js_1.webhookEvents)
            .where((0, drizzle_orm_1.eq)(schema_js_1.webhookEvents.id, eventId))
            .limit(1);
        if (!event)
            return null;
        return {
            id: event.id,
            provider: event.provider,
            instance_name: event.instanceName,
            external_event_id: event.externalEventId,
            event_type: event.eventType,
            payload: event.payload,
            status: event.status,
            received_at: event.receivedAt ? event.receivedAt.toISOString() : new Date().toISOString(),
        };
    }
    static async createAiAnalysis(data) {
        const chatLogId = data.chat_log_id || data.chat_id || null;
        const [row] = await database_js_1.db
            .insert(schema_js_1.aiAnalyses)
            .values({
            chatLogId,
            analysisType: data.analysis_type || 'moderation_sentiment',
            result: data.result || {},
            confidence: data.confidence ? String(data.confidence) : '0.90',
            modelUsed: data.model_used || env_js_1.env.OPENAI_MODEL,
            tokensUsed: data.tokens_used || null,
        })
            .returning();
        return {
            id: row.id,
            chat_log_id: row.chatLogId,
            analysis_type: row.analysisType,
            result: row.result,
            confidence: row.confidence ? Number(row.confidence) : 0.9,
            model_used: row.modelUsed,
            created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        };
    }
    static async createModerationAlert(data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.moderationAlerts)
            .values({
            groupId: data.group_id || null,
            memberId: data.member_id || null,
            chatLogId: data.chat_log_id || null,
            alertType: data.alert_type,
            severity: data.severity || 'medium',
            description: data.description || 'Alert created by n8n workflow',
            status: 'pending',
        })
            .returning();
        return {
            id: row.id,
            group_id: row.groupId,
            member_id: row.memberId,
            chat_log_id: row.chatLogId,
            alert_type: row.alertType,
            severity: row.severity,
            description: row.description,
            status: row.status,
            created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        };
    }
    static async createEscalation(data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.escalations)
            .values({
            title: data.title,
            description: data.description || null,
            groupId: data.group_id || null,
            memberId: data.member_id || null,
            assignedTo: data.assigned_to || null,
            priority: data.priority || 'medium',
            status: 'open',
        })
            .returning();
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            group_id: row.groupId,
            member_id: row.memberId,
            priority: row.priority,
            status: row.status,
            created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        };
    }
    static async createWorkflowRun(data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.workflowRuns)
            .values({
            name: data.name,
            triggerType: data.trigger_type,
            status: data.status || 'completed',
            inputData: data.input_data || null,
            outputData: data.output_data || null,
            errorMessage: data.error_message || null,
            durationMs: data.duration_ms || null,
            completedAt: new Date(),
        })
            .returning();
        return {
            id: row.id,
            name: row.name,
            trigger_type: row.triggerType,
            status: row.status,
            input_data: row.inputData,
            output_data: row.outputData,
            error_message: row.errorMessage,
            duration_ms: row.durationMs,
            started_at: row.startedAt ? row.startedAt.toISOString() : new Date().toISOString(),
            completed_at: row.completedAt ? row.completedAt.toISOString() : new Date().toISOString(),
        };
    }
}
exports.InternalService = InternalService;
