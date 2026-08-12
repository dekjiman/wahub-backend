import { db } from '../../config/database.js';
import { env } from '../../config/env.js';

import {
  broadcasts,
  broadcastRecipients,
  groups,
  members,
} from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { EvolutionService } from '../../services/evolution.service.js';

export class BroadcastsService {
  private static formatBroadcast(row: typeof broadcasts.$inferSelect) {
    return {
      id: row.id,
      created_by: row.createdBy || 'system',
      title: row.title,
      content: row.content,
      message_type: (row.messageType || 'text') as 'text' | 'image' | 'video' | 'document',
      media_url: row.mediaUrl,
      target_type: row.targetType as 'community' | 'group' | 'member',
      target_ids: row.targetIds || [],
      status: (row.status || 'draft') as
        | 'draft'
        | 'pending_approval'
        | 'approved'
        | 'sending'
        | 'sent'
        | 'failed',
      scheduled_at: row.scheduledAt ? row.scheduledAt.toISOString() : null,
      sent_at: row.sentAt ? row.sentAt.toISOString() : null,
      total_recipients: row.totalRecipients || 0,
      total_sent: row.totalSent || 0,
      total_failed: row.totalFailed || 0,
      created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  static async list() {
    const rows = await db.select().from(broadcasts);
    return rows.map((r) => this.formatBroadcast(r));
  }

  static async getById(id: string) {
    const row = await db.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
    });
    return row ? this.formatBroadcast(row) : null;
  }

  static async getRecipients(broadcastId: string) {
    const rows = await db
      .select({
        rec: broadcastRecipients,
        groupName: groups.name,
        memberName: members.displayName,
        whatsappNumber: members.whatsappNumber,
      })
      .from(broadcastRecipients)
      .leftJoin(groups, eq(broadcastRecipients.groupId, groups.id))
      .leftJoin(members, eq(broadcastRecipients.memberId, members.id))
      .where(eq(broadcastRecipients.broadcastId, broadcastId));

    return rows.map((r) => ({
      id: r.rec.id,
      group_name: r.groupName || 'Direct',
      member_name: r.memberName || r.whatsappNumber || 'Recipient',
      whatsapp_number: r.whatsappNumber || '',
      status: (r.rec.status || 'pending') as 'pending' | 'sent' | 'delivered' | 'failed',
      sent_at: r.rec.sentAt ? r.rec.sentAt.toISOString() : null,
      error_message: r.rec.errorMessage,
    }));
  }

  static async create(
    adminId: string,
    data: {
      title: string;
      content: string;
      message_type?: string;
      media_url?: string;
      target_type: string;
      target_ids: string[];
      scheduled_at?: string;
    }
  ) {
    const [row] = await db
      .insert(broadcasts)
      .values({
        createdBy: adminId,
        title: data.title,
        content: data.content,
        messageType: data.message_type || 'text',
        mediaUrl: data.media_url || null,
        targetType: data.target_type,
        targetIds: data.target_ids,
        scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : null,
        totalRecipients: data.target_ids.length,
        status: 'draft',
      })
      .returning();

    return this.formatBroadcast(row);
  }

  static async updateStatus(id: string, status: string) {
    const [row] = await db
      .update(broadcasts)
      .set({ status, updatedAt: new Date() })
      .where(eq(broadcasts.id, id))
      .returning();

    return row ? this.formatBroadcast(row) : null;
  }

  static async approve(id: string) {
    const broadcast = await db.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
    });

    if (!broadcast) return null;

    // Mark approved
    let newStatus = 'approved';
    const isImmediate = !broadcast.scheduledAt || broadcast.scheduledAt <= new Date();

    if (isImmediate) {
      newStatus = 'sending';
    }

    const [updated] = await db
      .update(broadcasts)
      .set({
        status: newStatus,
        sentAt: isImmediate ? new Date() : broadcast.sentAt,
        updatedAt: new Date(),
      })
      .where(eq(broadcasts.id, id))
      .returning();

    // If immediate, dispatch broadcast
    if (isImmediate) {
      this.executeBroadcast(id, broadcast);
    }

    return this.formatBroadcast(updated);
  }

  static async send(id: string) {
    const broadcast = await db.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
    });

    if (!broadcast) return null;

    await db
      .update(broadcasts)
      .set({
        status: 'sending',
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(broadcasts.id, id));

    await this.executeBroadcast(id, broadcast);
    return this.getById(id);
  }

  static async executeBroadcast(id: string, broadcast: any) {
    let sentCount = 0;
    let failCount = 0;

    const instanceName = env.EVOLUTION_DEFAULT_INSTANCE;
    const targetIds: string[] = broadcast.targetIds || broadcast.target_ids || [];

    for (let i = 0; i < targetIds.length; i++) {
      const targetId = targetIds[i];
      let recipientJid = targetId;
      let targetGroupId: string | null = null;
      let targetMemberId: string | null = null;

      if (broadcast.targetType === 'group') {
        const group = await db.query.groups.findFirst({
          where: eq(groups.id, targetId),
        });
        if (group) {
          recipientJid = group.whatsappGroupJid;
          targetGroupId = group.id;
        }
      } else if (broadcast.targetType === 'member') {
        const member = await db.query.members.findFirst({
          where: eq(members.id, targetId),
        });
        if (member && member.whatsappNumber) {
          recipientJid = `${member.whatsappNumber}@s.whatsapp.net`;
          targetMemberId = member.id;
        }
      } else if (broadcast.targetType === 'community') {
        const communityGroups = await db
          .select({ id: groups.id, jid: groups.whatsappGroupJid })
          .from(groups)
          .where(eq(groups.communityId, targetId));

        for (const cg of communityGroups) {
          try {
            let res: any = null;
            if (broadcast.messageType !== 'text' && broadcast.mediaUrl) {
              res = await EvolutionService.sendMedia(
                instanceName,
                cg.jid,
                broadcast.messageType,
                broadcast.mediaUrl,
                broadcast.content
              );
            } else {
              res = await EvolutionService.sendText(instanceName, cg.jid, broadcast.content);
            }

            const isSuccess = Boolean(res);
            if (isSuccess) sentCount++;
            else failCount++;

            await db.insert(broadcastRecipients).values({
              broadcastId: id,
              groupId: cg.id,
              whatsappMsgId: (res as any)?.key?.id || null,
              status: isSuccess ? 'sent' : 'failed',
              errorMessage: isSuccess ? null : 'Failed to deliver to community group',
              sentAt: new Date(),
            });

            // Anti-ban throttling delay (1000ms)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (err: any) {
            failCount++;
            await db.insert(broadcastRecipients).values({
              broadcastId: id,
              groupId: cg.id,
              status: 'failed',
              errorMessage: err.message,
              sentAt: new Date(),
            });
          }
        }
        continue;
      }

      try {
        let res: any = null;
        if (broadcast.messageType !== 'text' && broadcast.mediaUrl) {
          res = await EvolutionService.sendMedia(
            instanceName,
            recipientJid,
            broadcast.messageType,
            broadcast.mediaUrl,
            broadcast.content
          );
        } else {
          res = await EvolutionService.sendText(instanceName, recipientJid, broadcast.content);
        }

        const isSuccess = Boolean(res);
        if (isSuccess) sentCount++;
        else failCount++;

        await db.insert(broadcastRecipients).values({
          broadcastId: id,
          groupId: targetGroupId,
          memberId: targetMemberId,
          whatsappMsgId: (res as any)?.key?.id || null,
          status: isSuccess ? 'sent' : 'failed',
          errorMessage: isSuccess ? null : 'Failed to deliver message',
          sentAt: new Date(),
        });

        // Anti-ban throttling delay (1000ms)
        if (i < targetIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err: any) {
        failCount++;
        await db.insert(broadcastRecipients).values({
          broadcastId: id,
          groupId: targetGroupId,
          memberId: targetMemberId,
          status: 'failed',
          errorMessage: err.message,
          sentAt: new Date(),
        });
      }
    }

    const finalStatus =
      sentCount === 0 && failCount > 0
        ? 'failed'
        : failCount > 0
          ? 'partial_failed'
          : 'sent';

    await db
      .update(broadcasts)
      .set({
        status: finalStatus,
        totalSent: sentCount,
        totalFailed: failCount,
        updatedAt: new Date(),
      })
      .where(eq(broadcasts.id, id));
  }
}

