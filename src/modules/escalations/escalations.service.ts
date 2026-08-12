import { db } from '../../config/database.js';
import {
  escalations,
  escalationComments,
  groups,
  members,
  admins,
} from '../../../drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';


export class EscalationsService {
  private static async formatEscalation(id: string) {
    const row = await db
      .select({
        esc: escalations,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
        assignedName: admins.name,
      })
      .from(escalations)
      .leftJoin(groups, eq(escalations.groupId, groups.id))
      .leftJoin(members, eq(escalations.memberId, members.id))
      .leftJoin(admins, eq(escalations.assignedTo, admins.id))
      .where(eq(escalations.id, id));

    if (!row[0]) return null;

    const r = row[0];
    return {
      id: r.esc.id,
      group_id: r.esc.groupId || '',
      group_name: r.groupName || 'General',
      member_id: r.esc.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'Unknown Member',
      assigned_to: r.esc.assignedTo,
      assigned_name: r.assignedName,
      title: r.esc.title,
      description: r.esc.description || '',
      priority: (r.esc.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      status: (r.esc.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
      sla_deadline: r.esc.slaDeadline ? r.esc.slaDeadline.toISOString() : null,
      resolved_at: r.esc.resolvedAt ? r.esc.resolvedAt.toISOString() : null,
      created_at: r.esc.createdAt
        ? r.esc.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  static async list() {
    const rows = await db
      .select({
        esc: escalations,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
        assignedName: admins.name,
      })
      .from(escalations)
      .leftJoin(groups, eq(escalations.groupId, groups.id))
      .leftJoin(members, eq(escalations.memberId, members.id))
      .leftJoin(admins, eq(escalations.assignedTo, admins.id));

    return rows.map((r) => ({
      id: r.esc.id,
      group_id: r.esc.groupId || '',
      group_name: r.groupName || 'General',
      member_id: r.esc.memberId || '',
      member_name: r.memberName || r.whatsappNumber || 'Unknown Member',
      assigned_to: r.esc.assignedTo,
      assigned_name: r.assignedName,
      title: r.esc.title,
      description: r.esc.description || '',
      priority: (r.esc.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      status: (r.esc.status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed',
      sla_deadline: r.esc.slaDeadline ? r.esc.slaDeadline.toISOString() : null,
      resolved_at: r.esc.resolvedAt ? r.esc.resolvedAt.toISOString() : null,
      created_at: r.esc.createdAt
        ? r.esc.createdAt.toISOString()
        : new Date().toISOString(),
    }));
  }

  static async getById(id: string) {
    return this.formatEscalation(id);
  }

  static async getComments(escalationId: string) {
    const rows = await db
      .select({
        comment: escalationComments,
        adminName: admins.name,
      })
      .from(escalationComments)
      .leftJoin(admins, eq(escalationComments.adminId, admins.id))
      .where(eq(escalationComments.escalationId, escalationId));

    return rows.map((r) => ({
      id: r.comment.id,
      admin_id: r.comment.adminId || '',
      admin_name: r.adminName || 'System Admin',
      content: r.comment.content,
      is_internal: r.comment.isInternal || false,
      created_at: r.comment.createdAt
        ? r.comment.createdAt.toISOString()
        : new Date().toISOString(),
    }));
  }

  static async assign(id: string, adminId: string) {
    await db
      .update(escalations)
      .set({
        assignedTo: adminId,
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(escalations.id, id));

    return this.formatEscalation(id);
  }

  static async updateStatus(id: string, status: string) {
    const updatePayload: any = {
      status,
      updatedAt: new Date(),
    };
    if (status === 'resolved' || status === 'closed') {
      updatePayload.resolvedAt = new Date();
    }

    await db.update(escalations).set(updatePayload).where(eq(escalations.id, id));

    return this.formatEscalation(id);
  }

  static async addComment(
    escalationId: string,
    adminId: string,
    content: string,
    isInternal = false
  ) {
    const [comment] = await db
      .insert(escalationComments)
      .values({
        escalationId,
        adminId,
        content,
        isInternal,
      })
      .returning();

    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    return {
      id: comment.id,
      admin_id: adminId,
      admin_name: admin?.name || 'Admin',
      content: comment.content,
      is_internal: comment.isInternal || false,
      created_at: comment.createdAt
        ? comment.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  static async create(data: {
    title: string;
    description?: string;
    group_id?: string;
    member_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    const [row] = await db
      .insert(escalations)
      .values({
        title: data.title,
        description: data.description || null,
        groupId: data.group_id || null,
        memberId: data.member_id || null,
        priority: data.priority || 'medium',
        status: 'open',
      })
      .returning();

    // Human Takeover: Pause AI for group for 24h
    if (data.group_id) {
      const pauseUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db
        .update(groups)
        .set({ aiPausedUntil: pauseUntil })
        .where(eq(groups.id, data.group_id));
    }

    return this.formatEscalation(row.id);
  }

  static async resolve(id: string, adminId: string, notes?: string) {
    const [esc] = await db
      .select()
      .from(escalations)
      .where(eq(escalations.id, id))
      .limit(1);

    if (!esc) return null;

    await db
      .update(escalations)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(escalations.id, id));

    if (notes) {
      await db.insert(escalationComments).values({
        escalationId: id,
        adminId,
        content: `[Resolution Notes]: ${notes}`,
        isInternal: true,
      });
    }

    // Resume AI for group if no other open escalations exist for that group
    if (esc.groupId) {
      const otherOpen = await db
        .select({ id: escalations.id })
        .from(escalations)
        .where(
          sql`${escalations.groupId} = ${esc.groupId} AND ${escalations.status} IN ('open', 'in_progress') AND ${escalations.id} != ${id}`
        );

      if (otherOpen.length === 0) {
        await db
          .update(groups)
          .set({ aiPausedUntil: null })
          .where(eq(groups.id, esc.groupId));
      }
    }

    return this.formatEscalation(id);
  }
}

