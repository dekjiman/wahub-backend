import { db } from '../../config/database.js';
import {
  members,
  groupMembers,
  groups,
  communities,
  memberWarnings,
  chatLogs,
} from '../../../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';

export class MembersService {
  private static formatMember(row: typeof members.$inferSelect) {
    return {
      id: row.id,
      external_id: row.externalId,
      whatsapp_number: row.whatsappNumber,
      display_name: row.displayName || row.whatsappNumber,
      phone: row.phone,
      email: row.email,
      area: row.area,
      business_type: row.businessType,
      business_name: row.businessName,
      avatar_url: row.avatarUrl,
      status: row.status as 'active' | 'inactive' | 'banned',
      warning_count: row.warningCount || 0,
      joined_at: row.joinedAt ? row.joinedAt.toISOString() : new Date().toISOString(),
      last_active_at: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
    };
  }

  static async list() {
    const rows = await db.select().from(members);
    return rows.map((r) => this.formatMember(r));
  }

  static async getById(id: string) {
    const row = await db.query.members.findFirst({
      where: eq(members.id, id),
    });
    return row ? this.formatMember(row) : null;
  }

  static async create(data: {
    whatsapp_number: string;
    display_name?: string;
    phone?: string;
    email?: string;
    area?: string;
    business_type?: string;
    business_name?: string;
    avatar_url?: string;
  }) {
    const [row] = await db
      .insert(members)
      .values({
        whatsappNumber: data.whatsapp_number,
        displayName: data.display_name || null,
        phone: data.phone || data.whatsapp_number,
        email: data.email || null,
        area: data.area || null,
        businessType: data.business_type || null,
        businessName: data.business_name || null,
        avatarUrl: data.avatar_url || null,
      })
      .returning();

    return this.formatMember(row);
  }

  static async update(
    id: string,
    data: {
      display_name?: string;
      phone?: string | null;
      email?: string | null;
      area?: string | null;
      business_type?: string | null;
      business_name?: string | null;
      avatar_url?: string | null;
      status?: string;
    }
  ) {
    const updatePayload: any = { updatedAt: new Date() };

    if (data.display_name !== undefined) updatePayload.displayName = data.display_name;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.area !== undefined) updatePayload.area = data.area;
    if (data.business_type !== undefined) updatePayload.businessType = data.business_type;
    if (data.business_name !== undefined) updatePayload.businessName = data.business_name;
    if (data.avatar_url !== undefined) updatePayload.avatarUrl = data.avatar_url;
    if (data.status !== undefined) updatePayload.status = data.status;

    const [row] = await db
      .update(members)
      .set(updatePayload)
      .where(eq(members.id, id))
      .returning();

    return row ? this.formatMember(row) : null;
  }

  static async getGroups(memberId: string) {
    const rows = await db
      .select({
        group_id: groups.id,
        group_name: groups.name,
        community_name: communities.name,
        role: groupMembers.role,
        joined_at: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .leftJoin(communities, eq(groups.communityId, communities.id))
      .where(eq(groupMembers.memberId, memberId));

    return rows.map((r) => ({
      group_id: r.group_id,
      group_name: r.group_name,
      community_name: r.community_name || 'General',
      role: r.role || 'member',
      joined_at: r.joined_at ? r.joined_at.toISOString() : new Date().toISOString(),
    }));
  }

  static async getWarnings(memberId: string) {
    const rows = await db
      .select()
      .from(memberWarnings)
      .where(eq(memberWarnings.memberId, memberId));

    return rows.map((r) => ({
      id: r.id,
      violation_type: r.violationType,
      reason: r.reason,
      severity: r.severity || 'warning',
      issued_by: r.issuedBy || 'System',
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));
  }

  static async issueWarning(
    memberId: string,
    adminId: string,
    data: {
      violation_type: string;
      reason: string;
      group_id?: string;
      severity?: string;
    }
  ) {
    const [warning] = await db
      .insert(memberWarnings)
      .values({
        memberId,
        groupId: data.group_id || null,
        issuedBy: adminId,
        violationType: data.violation_type,
        reason: data.reason,
        severity: data.severity || 'warning',
      })
      .returning();

    // Increment member warningCount
    await db
      .update(members)
      .set({
        warningCount: sql`${members.warningCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    return {
      id: warning.id,
      violation_type: warning.violationType,
      reason: warning.reason,
      severity: warning.severity || 'warning',
      issued_by: warning.issuedBy || adminId,
      created_at: warning.createdAt
        ? warning.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  static async getMessages(memberId: string) {
    const rows = await db
      .select({
        chatLog: chatLogs,
        groupName: groups.name,
        memberDisplayName: members.displayName,
        memberPhone: members.whatsappNumber,
      })
      .from(chatLogs)
      .leftJoin(groups, eq(chatLogs.groupId, groups.id))
      .leftJoin(members, eq(chatLogs.memberId, members.id))
      .where(eq(chatLogs.memberId, memberId));

    return rows.map((r) => ({
      id: r.chatLog.id,
      group_id: r.chatLog.groupId,
      group_name: r.groupName || 'Direct',
      member_id: r.chatLog.memberId,
      member_name: r.memberDisplayName || r.memberPhone || 'Unknown',
      direction: r.chatLog.direction,
      content: r.chatLog.content || '',
      message_type: r.chatLog.messageType || 'text',
      is_from_ai: r.chatLog.isFromAi || false,
      sentiment: r.chatLog.sentiment,
      topic: r.chatLog.topic,
      is_spam: r.chatLog.isSpam || false,
      is_flagged: r.chatLog.isFlagged || false,
      sent_at: r.chatLog.sentAt
        ? r.chatLog.sentAt.toISOString()
        : new Date().toISOString(),
    }));
  }
}
