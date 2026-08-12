import { db } from '../../config/database.js';
import { chatLogs, groups, members } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export class ChatLogsService {
  private static async formatLog(id: string) {
    const rows = await db
      .select({
        log: chatLogs,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
      })
      .from(chatLogs)
      .leftJoin(groups, eq(chatLogs.groupId, groups.id))
      .leftJoin(members, eq(chatLogs.memberId, members.id))
      .where(eq(chatLogs.id, id));

    if (!rows[0]) return null;

    const r = rows[0];
    return {
      id: r.log.id,
      group_id: r.log.groupId || '',
      group_name: r.groupName || 'Direct',
      member_id: r.log.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'System/AI',
      direction: r.log.direction,
      content: r.log.content || '',
      message_type: r.log.messageType || 'text',
      is_from_ai: r.log.isFromAi || false,
      sentiment: r.log.sentiment,
      topic: r.log.topic,
      is_spam: r.log.isSpam || false,
      is_flagged: r.log.isFlagged || false,
      sent_at: r.log.sentAt ? r.log.sentAt.toISOString() : new Date().toISOString(),
    };
  }

  static async list() {
    const rows = await db
      .select({
        log: chatLogs,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
      })
      .from(chatLogs)
      .leftJoin(groups, eq(chatLogs.groupId, groups.id))
      .leftJoin(members, eq(chatLogs.memberId, members.id));

    return rows.map((r) => ({
      id: r.log.id,
      group_id: r.log.groupId || '',
      group_name: r.groupName || 'Direct',
      member_id: r.log.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'System/AI',
      direction: r.log.direction,
      content: r.log.content || '',
      message_type: r.log.messageType || 'text',
      is_from_ai: r.log.isFromAi || false,
      sentiment: r.log.sentiment,
      topic: r.log.topic,
      is_spam: r.log.isSpam || false,
      is_flagged: r.log.isFlagged || false,
      sent_at: r.log.sentAt ? r.log.sentAt.toISOString() : new Date().toISOString(),
    }));
  }

  static async getById(id: string) {
    return this.formatLog(id);
  }

  static async getByMember(memberId: string) {
    const rows = await db
      .select({
        log: chatLogs,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
      })
      .from(chatLogs)
      .leftJoin(groups, eq(chatLogs.groupId, groups.id))
      .leftJoin(members, eq(chatLogs.memberId, members.id))
      .where(eq(chatLogs.memberId, memberId));

    return rows.map((r) => ({
      id: r.log.id,
      group_id: r.log.groupId || '',
      group_name: r.groupName || 'Direct',
      member_id: r.log.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'System/AI',
      direction: r.log.direction,
      content: r.log.content || '',
      message_type: r.log.messageType || 'text',
      is_from_ai: r.log.isFromAi || false,
      sentiment: r.log.sentiment,
      topic: r.log.topic,
      is_spam: r.log.isSpam || false,
      is_flagged: r.log.isFlagged || false,
      sent_at: r.log.sentAt ? r.log.sentAt.toISOString() : new Date().toISOString(),
    }));
  }
}
