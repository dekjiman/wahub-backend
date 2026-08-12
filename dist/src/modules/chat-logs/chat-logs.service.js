"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatLogsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class ChatLogsService {
    static async formatLog(id) {
        const rows = await database_js_1.db
            .select({
            log: schema_js_1.chatLogs,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.chatLogs)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.id, id));
        if (!rows[0])
            return null;
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
        const rows = await database_js_1.db
            .select({
            log: schema_js_1.chatLogs,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.chatLogs)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, schema_js_1.members.id));
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
    static async getById(id) {
        return this.formatLog(id);
    }
    static async getByMember(memberId) {
        const rows = await database_js_1.db
            .select({
            log: schema_js_1.chatLogs,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
        })
            .from(schema_js_1.chatLogs)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, schema_js_1.members.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.chatLogs.memberId, memberId));
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
exports.ChatLogsService = ChatLogsService;
