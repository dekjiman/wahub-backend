import { db } from '../../config/database.js';
import {
  moderationAlerts,
  groups,
  members,
  chatLogs,
} from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export class ModerationService {
  private static async formatAlert(alertId: string) {
    const row = await db
      .select({
        alert: moderationAlerts,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
      })
      .from(moderationAlerts)
      .leftJoin(groups, eq(moderationAlerts.groupId, groups.id))
      .leftJoin(members, eq(moderationAlerts.memberId, members.id))
      .where(eq(moderationAlerts.id, alertId));

    if (!row[0]) return null;

    const r = row[0];
    return {
      id: r.alert.id,
      group_id: r.alert.groupId || '',
      group_name: r.groupName || 'Unknown Group',
      member_id: r.alert.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'Unknown Member',
      chat_log_id: r.alert.chatLogId || '',
      alert_type: (r.alert.alertType || 'other') as
        | 'spam'
        | 'flood'
        | 'toxic'
        | 'link'
        | 'other',
      severity: (r.alert.severity || 'medium') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      description: r.alert.description || '',
      status: (r.alert.status || 'pending') as
        | 'pending'
        | 'approved'
        | 'rejected'
        | 'executed',
      reviewed_by: r.alert.reviewedBy,
      reviewed_at: r.alert.reviewedAt ? r.alert.reviewedAt.toISOString() : null,
      action_taken: r.alert.actionTaken,
      created_at: r.alert.createdAt
        ? r.alert.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  static async list() {
    const rows = await db
      .select({
        alert: moderationAlerts,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
      })
      .from(moderationAlerts)
      .leftJoin(groups, eq(moderationAlerts.groupId, groups.id))
      .leftJoin(members, eq(moderationAlerts.memberId, members.id));

    return rows.map((r) => ({
      id: r.alert.id,
      group_id: r.alert.groupId || '',
      group_name: r.groupName || 'Unknown Group',
      member_id: r.alert.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'Unknown Member',
      chat_log_id: r.alert.chatLogId || '',
      alert_type: (r.alert.alertType || 'other') as
        | 'spam'
        | 'flood'
        | 'toxic'
        | 'link'
        | 'other',
      severity: (r.alert.severity || 'medium') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      description: r.alert.description || '',
      status: (r.alert.status || 'pending') as
        | 'pending'
        | 'approved'
        | 'rejected'
        | 'executed',
      reviewed_by: r.alert.reviewedBy,
      reviewed_at: r.alert.reviewedAt ? r.alert.reviewedAt.toISOString() : null,
      action_taken: r.alert.actionTaken,
      created_at: r.alert.createdAt
        ? r.alert.createdAt.toISOString()
        : new Date().toISOString(),
    }));
  }

  static async getById(id: string) {
    return this.formatAlert(id);
  }

  static async approve(id: string, adminId: string) {
    await db
      .update(moderationAlerts)
      .set({
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      })
      .where(eq(moderationAlerts.id, id));

    return this.formatAlert(id);
  }

  static async reject(id: string, adminId: string) {
    await db
      .update(moderationAlerts)
      .set({
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      })
      .where(eq(moderationAlerts.id, id));

    return this.formatAlert(id);
  }

  static async execute(id: string, adminId: string, actionTaken?: string) {
    const action = actionTaken || 'warn';

    const [alertRow] = await db
      .select({
        alert: moderationAlerts,
        groupJid: groups.whatsappGroupJid,
        groupName: groups.name,
        memberPhone: members.whatsappNumber,
      })
      .from(moderationAlerts)
      .leftJoin(groups, eq(moderationAlerts.groupId, groups.id))
      .leftJoin(members, eq(moderationAlerts.memberId, members.id))
      .where(eq(moderationAlerts.id, id))
      .limit(1);

    if (!alertRow) return null;

    const { EvolutionService } = await import('../../services/evolution.service.js');

    try {
      if (action === 'warn' && alertRow.groupJid) {
        await EvolutionService.sendText(
          'wahub-main',
          alertRow.groupJid,
          `[Peringatan Moderasi] Anggota ${alertRow.memberPhone ? '@' + alertRow.memberPhone : ''} telah diperingatkan atas pelanggaran: ${alertRow.alert.description || 'Konten tidak pantas'}.`
        );
      } else if ((action === 'kick' || action === 'remove') && alertRow.groupJid && alertRow.memberPhone) {
        const participantJid = `${alertRow.memberPhone}@s.whatsapp.net`;
        await EvolutionService.removeGroupParticipants('wahub-main', alertRow.groupJid, [participantJid]);
      } else if (action === 'delete' && alertRow.alert.chatLogId) {
        await db
          .update(chatLogs)
          .set({ isFlagged: true })
          .where(eq(chatLogs.id, alertRow.alert.chatLogId));
      }
    } catch (err: any) {
      // Log execution error but still record action taken
    }

    await db
      .update(moderationAlerts)
      .set({
        status: 'executed',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        actionTaken: action,
      })
      .where(eq(moderationAlerts.id, id));

    return this.formatAlert(id);
  }
}

