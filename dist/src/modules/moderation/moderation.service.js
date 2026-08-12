"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class ModerationService {
    static async formatAlert(alertId) {
        const row = await database_js_1.db
            .select({
            alert: schema_js_1.moderationAlerts,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.moderationAlerts)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.id, alertId));
        if (!row[0])
            return null;
        const r = row[0];
        return {
            id: r.alert.id,
            group_id: r.alert.groupId || '',
            group_name: r.groupName || 'Unknown Group',
            member_id: r.alert.memberId || '',
            member_name: r.memberName || r.whatsappNumber || 'Unknown Member',
            chat_log_id: r.alert.chatLogId || '',
            alert_type: (r.alert.alertType || 'other'),
            severity: (r.alert.severity || 'medium'),
            description: r.alert.description || '',
            status: (r.alert.status || 'pending'),
            reviewed_by: r.alert.reviewedBy,
            reviewed_at: r.alert.reviewedAt ? r.alert.reviewedAt.toISOString() : null,
            action_taken: r.alert.actionTaken,
            created_at: r.alert.createdAt
                ? r.alert.createdAt.toISOString()
                : new Date().toISOString(),
        };
    }
    static async list() {
        const rows = await database_js_1.db
            .select({
            alert: schema_js_1.moderationAlerts,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.moderationAlerts)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.memberId, schema_js_1.members.id));
        return rows.map((r) => ({
            id: r.alert.id,
            group_id: r.alert.groupId || '',
            group_name: r.groupName || 'Unknown Group',
            member_id: r.alert.memberId || '',
            member_name: r.memberName || r.whatsappNumber || 'Unknown Member',
            chat_log_id: r.alert.chatLogId || '',
            alert_type: (r.alert.alertType || 'other'),
            severity: (r.alert.severity || 'medium'),
            description: r.alert.description || '',
            status: (r.alert.status || 'pending'),
            reviewed_by: r.alert.reviewedBy,
            reviewed_at: r.alert.reviewedAt ? r.alert.reviewedAt.toISOString() : null,
            action_taken: r.alert.actionTaken,
            created_at: r.alert.createdAt
                ? r.alert.createdAt.toISOString()
                : new Date().toISOString(),
        }));
    }
    static async getById(id) {
        return this.formatAlert(id);
    }
    static async approve(id, adminId) {
        await database_js_1.db
            .update(schema_js_1.moderationAlerts)
            .set({
            status: 'approved',
            reviewedBy: adminId,
            reviewedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.id, id));
        return this.formatAlert(id);
    }
    static async reject(id, adminId) {
        await database_js_1.db
            .update(schema_js_1.moderationAlerts)
            .set({
            status: 'rejected',
            reviewedBy: adminId,
            reviewedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.id, id));
        return this.formatAlert(id);
    }
    static async execute(id, adminId, actionTaken) {
        const action = actionTaken || 'warn';
        const [alertRow] = await database_js_1.db
            .select({
            alert: schema_js_1.moderationAlerts,
            groupJid: schema_js_1.groups.whatsappGroupJid,
            groupName: schema_js_1.groups.name,
            memberPhone: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.moderationAlerts)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.id, id))
            .limit(1);
        if (!alertRow)
            return null;
        const { EvolutionService } = await import('../../services/evolution.service.js');
        try {
            if (action === 'warn' && alertRow.groupJid) {
                await EvolutionService.sendText('wahub-main', alertRow.groupJid, `[Peringatan Moderasi] Anggota ${alertRow.memberPhone ? '@' + alertRow.memberPhone : ''} telah diperingatkan atas pelanggaran: ${alertRow.alert.description || 'Konten tidak pantas'}.`);
            }
            else if ((action === 'kick' || action === 'remove') && alertRow.groupJid && alertRow.memberPhone) {
                const participantJid = `${alertRow.memberPhone}@s.whatsapp.net`;
                await EvolutionService.removeGroupParticipants('wahub-main', alertRow.groupJid, [participantJid]);
            }
            else if (action === 'delete' && alertRow.alert.chatLogId) {
                await database_js_1.db
                    .update(schema_js_1.chatLogs)
                    .set({ isFlagged: true })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.id, alertRow.alert.chatLogId));
            }
        }
        catch (err) {
            // Log execution error but still record action taken
        }
        await database_js_1.db
            .update(schema_js_1.moderationAlerts)
            .set({
            status: 'executed',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            actionTaken: action,
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.moderationAlerts.id, id));
        return this.formatAlert(id);
    }
}
exports.ModerationService = ModerationService;
