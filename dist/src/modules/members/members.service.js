"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class MembersService {
    static formatMember(row) {
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
            status: row.status,
            warning_count: row.warningCount || 0,
            joined_at: row.joinedAt ? row.joinedAt.toISOString() : new Date().toISOString(),
            last_active_at: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
        };
    }
    static async list() {
        const rows = await database_js_1.db.select().from(schema_js_1.members);
        return rows.map((r) => this.formatMember(r));
    }
    static async getById(id) {
        const row = await database_js_1.db.query.members.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.members.id, id),
        });
        return row ? this.formatMember(row) : null;
    }
    static async create(data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.members)
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
    static async update(id, data) {
        const updatePayload = { updatedAt: new Date() };
        if (data.display_name !== undefined)
            updatePayload.displayName = data.display_name;
        if (data.phone !== undefined)
            updatePayload.phone = data.phone;
        if (data.email !== undefined)
            updatePayload.email = data.email;
        if (data.area !== undefined)
            updatePayload.area = data.area;
        if (data.business_type !== undefined)
            updatePayload.businessType = data.business_type;
        if (data.business_name !== undefined)
            updatePayload.businessName = data.business_name;
        if (data.avatar_url !== undefined)
            updatePayload.avatarUrl = data.avatar_url;
        if (data.status !== undefined)
            updatePayload.status = data.status;
        const [row] = await database_js_1.db
            .update(schema_js_1.members)
            .set(updatePayload)
            .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, id))
            .returning();
        return row ? this.formatMember(row) : null;
    }
    static async getGroups(memberId) {
        const rows = await database_js_1.db
            .select({
            group_id: schema_js_1.groups.id,
            group_name: schema_js_1.groups.name,
            community_name: schema_js_1.communities.name,
            role: schema_js_1.groupMembers.role,
            joined_at: schema_js_1.groupMembers.joinedAt,
        })
            .from(schema_js_1.groupMembers)
            .innerJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.groupMembers.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.communities, (0, drizzle_orm_1.eq)(schema_js_1.groups.communityId, schema_js_1.communities.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.groupMembers.memberId, memberId));
        return rows.map((r) => ({
            group_id: r.group_id,
            group_name: r.group_name,
            community_name: r.community_name || 'General',
            role: r.role || 'member',
            joined_at: r.joined_at ? r.joined_at.toISOString() : new Date().toISOString(),
        }));
    }
    static async getWarnings(memberId) {
        const rows = await database_js_1.db
            .select()
            .from(schema_js_1.memberWarnings)
            .where((0, drizzle_orm_1.eq)(schema_js_1.memberWarnings.memberId, memberId));
        return rows.map((r) => ({
            id: r.id,
            violation_type: r.violationType,
            reason: r.reason,
            severity: r.severity || 'warning',
            issued_by: r.issuedBy || 'System',
            created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        }));
    }
    static async issueWarning(memberId, adminId, data) {
        const [warning] = await database_js_1.db
            .insert(schema_js_1.memberWarnings)
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
        await database_js_1.db
            .update(schema_js_1.members)
            .set({
            warningCount: (0, drizzle_orm_1.sql) `${schema_js_1.members.warningCount} + 1`,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.members.id, memberId));
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
    static async getMessages(memberId) {
        const rows = await database_js_1.db
            .select({
            chatLog: schema_js_1.chatLogs,
            groupName: schema_js_1.groups.name,
            memberDisplayName: schema_js_1.members.displayName,
            memberPhone: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.chatLogs)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, memberId));
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
exports.MembersService = MembersService;
