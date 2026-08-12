"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastsService = void 0;
const database_js_1 = require("../../config/database.js");
const env_js_1 = require("../../config/env.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const evolution_service_js_1 = require("../../services/evolution.service.js");
class BroadcastsService {
    static formatBroadcast(row) {
        return {
            id: row.id,
            created_by: row.createdBy || 'system',
            title: row.title,
            content: row.content,
            message_type: (row.messageType || 'text'),
            media_url: row.mediaUrl,
            target_type: row.targetType,
            target_ids: row.targetIds || [],
            status: (row.status || 'draft'),
            scheduled_at: row.scheduledAt ? row.scheduledAt.toISOString() : null,
            sent_at: row.sentAt ? row.sentAt.toISOString() : null,
            total_recipients: row.totalRecipients || 0,
            total_sent: row.totalSent || 0,
            total_failed: row.totalFailed || 0,
            created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        };
    }
    static async list() {
        const rows = await database_js_1.db.select().from(schema_js_1.broadcasts);
        return rows.map((r) => this.formatBroadcast(r));
    }
    static async getById(id) {
        const row = await database_js_1.db.query.broadcasts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id),
        });
        return row ? this.formatBroadcast(row) : null;
    }
    static async getRecipients(broadcastId) {
        const rows = await database_js_1.db
            .select({
            rec: schema_js_1.broadcastRecipients,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.broadcastRecipients)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.broadcastRecipients.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.broadcastRecipients.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.broadcastRecipients.broadcastId, broadcastId));
        return rows.map((r) => ({
            id: r.rec.id,
            group_name: r.groupName || 'Direct',
            member_name: r.memberName || r.whatsappNumber || 'Recipient',
            whatsapp_number: r.whatsappNumber || '',
            status: (r.rec.status || 'pending'),
            sent_at: r.rec.sentAt ? r.rec.sentAt.toISOString() : null,
            error_message: r.rec.errorMessage,
        }));
    }
    static async create(adminId, data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.broadcasts)
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
    static async updateStatus(id, status) {
        const [row] = await database_js_1.db
            .update(schema_js_1.broadcasts)
            .set({ status, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id))
            .returning();
        return row ? this.formatBroadcast(row) : null;
    }
    static async approve(id) {
        const broadcast = await database_js_1.db.query.broadcasts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id),
        });
        if (!broadcast)
            return null;
        // Mark approved
        let newStatus = 'approved';
        const isImmediate = !broadcast.scheduledAt || broadcast.scheduledAt <= new Date();
        if (isImmediate) {
            newStatus = 'sending';
        }
        const [updated] = await database_js_1.db
            .update(schema_js_1.broadcasts)
            .set({
            status: newStatus,
            sentAt: isImmediate ? new Date() : broadcast.sentAt,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id))
            .returning();
        // If immediate, dispatch broadcast
        if (isImmediate) {
            this.executeBroadcast(id, broadcast);
        }
        return this.formatBroadcast(updated);
    }
    static async send(id) {
        const broadcast = await database_js_1.db.query.broadcasts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id),
        });
        if (!broadcast)
            return null;
        await database_js_1.db
            .update(schema_js_1.broadcasts)
            .set({
            status: 'sending',
            sentAt: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id));
        await this.executeBroadcast(id, broadcast);
        return this.getById(id);
    }
    static async executeBroadcast(id, broadcast) {
        let sentCount = 0;
        let failCount = 0;
        const instanceName = env_js_1.env.EVOLUTION_DEFAULT_INSTANCE;
        const targetIds = broadcast.targetIds || broadcast.target_ids || [];
        for (let i = 0; i < targetIds.length; i++) {
            const targetId = targetIds[i];
            let recipientJid = targetId;
            let targetGroupId = null;
            let targetMemberId = null;
            if (broadcast.targetType === 'group') {
                const group = await database_js_1.db.query.groups.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema_js_1.groups.id, targetId),
                });
                if (group) {
                    recipientJid = group.whatsappGroupJid;
                    targetGroupId = group.id;
                }
            }
            else if (broadcast.targetType === 'member') {
                const member = await database_js_1.db.query.members.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema_js_1.members.id, targetId),
                });
                if (member && member.whatsappNumber) {
                    recipientJid = `${member.whatsappNumber}@s.whatsapp.net`;
                    targetMemberId = member.id;
                }
            }
            else if (broadcast.targetType === 'community') {
                const communityGroups = await database_js_1.db
                    .select({ id: schema_js_1.groups.id, jid: schema_js_1.groups.whatsappGroupJid })
                    .from(schema_js_1.groups)
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.communityId, targetId));
                for (const cg of communityGroups) {
                    try {
                        let res = null;
                        if (broadcast.messageType !== 'text' && broadcast.mediaUrl) {
                            res = await evolution_service_js_1.EvolutionService.sendMedia(instanceName, cg.jid, broadcast.messageType, broadcast.mediaUrl, broadcast.content);
                        }
                        else {
                            res = await evolution_service_js_1.EvolutionService.sendText(instanceName, cg.jid, broadcast.content);
                        }
                        const isSuccess = Boolean(res);
                        if (isSuccess)
                            sentCount++;
                        else
                            failCount++;
                        await database_js_1.db.insert(schema_js_1.broadcastRecipients).values({
                            broadcastId: id,
                            groupId: cg.id,
                            whatsappMsgId: res?.key?.id || null,
                            status: isSuccess ? 'sent' : 'failed',
                            errorMessage: isSuccess ? null : 'Failed to deliver to community group',
                            sentAt: new Date(),
                        });
                        // Anti-ban throttling delay (1000ms)
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                    catch (err) {
                        failCount++;
                        await database_js_1.db.insert(schema_js_1.broadcastRecipients).values({
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
                let res = null;
                if (broadcast.messageType !== 'text' && broadcast.mediaUrl) {
                    res = await evolution_service_js_1.EvolutionService.sendMedia(instanceName, recipientJid, broadcast.messageType, broadcast.mediaUrl, broadcast.content);
                }
                else {
                    res = await evolution_service_js_1.EvolutionService.sendText(instanceName, recipientJid, broadcast.content);
                }
                const isSuccess = Boolean(res);
                if (isSuccess)
                    sentCount++;
                else
                    failCount++;
                await database_js_1.db.insert(schema_js_1.broadcastRecipients).values({
                    broadcastId: id,
                    groupId: targetGroupId,
                    memberId: targetMemberId,
                    whatsappMsgId: res?.key?.id || null,
                    status: isSuccess ? 'sent' : 'failed',
                    errorMessage: isSuccess ? null : 'Failed to deliver message',
                    sentAt: new Date(),
                });
                // Anti-ban throttling delay (1000ms)
                if (i < targetIds.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
            catch (err) {
                failCount++;
                await database_js_1.db.insert(schema_js_1.broadcastRecipients).values({
                    broadcastId: id,
                    groupId: targetGroupId,
                    memberId: targetMemberId,
                    status: 'failed',
                    errorMessage: err.message,
                    sentAt: new Date(),
                });
            }
        }
        const finalStatus = sentCount === 0 && failCount > 0
            ? 'failed'
            : failCount > 0
                ? 'partial_failed'
                : 'sent';
        await database_js_1.db
            .update(schema_js_1.broadcasts)
            .set({
            status: finalStatus,
            totalSent: sentCount,
            totalFailed: failCount,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.broadcasts.id, id));
    }
}
exports.BroadcastsService = BroadcastsService;
