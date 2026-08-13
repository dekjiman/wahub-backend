import { db } from '../../config/database.js';
import {
  webhookEvents,
  aiAnalyses,
  moderationAlerts,
  escalations,
  workflowRuns,
  admins,
  memberWarnings,
  members,
  groups,
} from '../../../drizzle/schema.js';
import { eq, sql, and } from 'drizzle-orm';
import { env } from '../../config/env.js';

export class InternalService {
  static async getEventById(eventId: string) {
    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);

    if (!event) return null;

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

  static async createAiAnalysis(data: {
    chat_log_id?: string;
    chat_id?: string;
    analysis_type?: string;
    result: any;
    confidence?: number;
    model_used?: string;
    tokens_used?: number;
  }) {
    const chatLogId = data.chat_log_id || data.chat_id || null;
    const [row] = await db
      .insert(aiAnalyses)
      .values({
        chatLogId,
        analysisType: data.analysis_type || 'moderation_sentiment',
        result: data.result || {},
        confidence: data.confidence ? String(data.confidence) : '0.90',
        modelUsed: data.model_used || env.OPENAI_MODEL,
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

  static async createModerationAlert(data: {
    group_id?: string;
    member_id?: string;
    chat_log_id?: string;
    alert_type: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
  }) {
    const [row] = await db
      .insert(moderationAlerts)
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

  static async createEscalation(data: {
    title: string;
    description?: string;
    group_id?: string;
    member_id?: string;
    assigned_to?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    const [row] = await db
      .insert(escalations)
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

  static async createWorkflowRun(data: {
    name: string;
    trigger_type?: string;
    status?: string;
    input_data?: any;
    output_data?: any;
    error_message?: string;
    duration_ms?: number;
  }) {
    const [row] = await db
      .insert(workflowRuns)
      .values({
        name: data.name,
        triggerType: data.trigger_type || 'webhook',
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

  static async listAdmins(role?: string) {
    const conditions = [eq(admins.status, 'active')];
    if (role) conditions.push(sql`${admins.role} = ${role}`);

    const rows = await db
      .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role, phone: admins.phone, status: admins.status })
      .from(admins)
      .where(and(...conditions));

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      phone: r.phone,
      status: r.status,
    }));
  }

  static async createMemberWarning(data: {
    member_id: string;
    group_id?: string;
    violation_type: string;
    reason: string;
    severity?: string;
    issued_by?: string;
  }) {
    const [row] = await db
      .insert(memberWarnings)
      .values({
        memberId: data.member_id,
        groupId: data.group_id || null,
        issuedBy: data.issued_by || null,
        violationType: data.violation_type,
        reason: data.reason,
        severity: data.severity || 'warning',
        status: 'active',
      })
      .returning();

    await db
      .update(members)
      .set({ warningCount: sql`${members.warningCount} + 1`, updatedAt: new Date() })
      .where(eq(members.id, data.member_id));

    return {
      id: row.id,
      member_id: row.memberId,
      group_id: row.groupId,
      violation_type: row.violationType,
      reason: row.reason,
      severity: row.severity,
      status: row.status,
      created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  static async lookupMemberByPhone(phone: string) {
    const [row] = await db
      .select({ id: members.id, whatsappNumber: members.whatsappNumber, displayName: members.displayName, warningCount: members.warningCount })
      .from(members)
      .where(eq(members.whatsappNumber, phone))
      .limit(1);
    return row || null;
  }

  static async lookupGroupByJid(jid: string) {
    const [row] = await db
      .select({ id: groups.id, name: groups.name, whatsappGroupJid: groups.whatsappGroupJid })
      .from(groups)
      .where(eq(groups.whatsappGroupJid, jid))
      .limit(1);
    return row || null;
  }
}
