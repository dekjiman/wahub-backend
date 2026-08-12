"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class EscalationsService {
    static async formatEscalation(id) {
        const row = await database_js_1.db
            .select({
            esc: schema_js_1.escalations,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
            assignedName: schema_js_1.admins.name,
        })
            .from(schema_js_1.escalations)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.escalations.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.escalations.memberId, schema_js_1.members.id))
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.escalations.assignedTo, schema_js_1.admins.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.escalations.id, id));
        if (!row[0])
            return null;
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
            priority: (r.esc.priority || 'medium'),
            status: (r.esc.status || 'open'),
            sla_deadline: r.esc.slaDeadline ? r.esc.slaDeadline.toISOString() : null,
            resolved_at: r.esc.resolvedAt ? r.esc.resolvedAt.toISOString() : null,
            created_at: r.esc.createdAt
                ? r.esc.createdAt.toISOString()
                : new Date().toISOString(),
        };
    }
    static async list() {
        const rows = await database_js_1.db
            .select({
            esc: schema_js_1.escalations,
            groupName: schema_js_1.groups.name,
            memberName: schema_js_1.members.displayName,
            whatsappNumber: schema_js_1.members.whatsappNumber,
            assignedName: schema_js_1.admins.name,
        })
            .from(schema_js_1.escalations)
            .leftJoin(schema_js_1.groups, (0, drizzle_orm_1.eq)(schema_js_1.escalations.groupId, schema_js_1.groups.id))
            .leftJoin(schema_js_1.members, (0, drizzle_orm_1.eq)(schema_js_1.escalations.memberId, schema_js_1.members.id))
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.escalations.assignedTo, schema_js_1.admins.id));
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
            priority: (r.esc.priority || 'medium'),
            status: (r.esc.status || 'open'),
            sla_deadline: r.esc.slaDeadline ? r.esc.slaDeadline.toISOString() : null,
            resolved_at: r.esc.resolvedAt ? r.esc.resolvedAt.toISOString() : null,
            created_at: r.esc.createdAt
                ? r.esc.createdAt.toISOString()
                : new Date().toISOString(),
        }));
    }
    static async getById(id) {
        return this.formatEscalation(id);
    }
    static async getComments(escalationId) {
        const rows = await database_js_1.db
            .select({
            comment: schema_js_1.escalationComments,
            adminName: schema_js_1.admins.name,
        })
            .from(schema_js_1.escalationComments)
            .leftJoin(schema_js_1.admins, (0, drizzle_orm_1.eq)(schema_js_1.escalationComments.adminId, schema_js_1.admins.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.escalationComments.escalationId, escalationId));
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
    static async assign(id, adminId) {
        await database_js_1.db
            .update(schema_js_1.escalations)
            .set({
            assignedTo: adminId,
            status: 'in_progress',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.escalations.id, id));
        return this.formatEscalation(id);
    }
    static async updateStatus(id, status) {
        const updatePayload = {
            status,
            updatedAt: new Date(),
        };
        if (status === 'resolved' || status === 'closed') {
            updatePayload.resolvedAt = new Date();
        }
        await database_js_1.db.update(schema_js_1.escalations).set(updatePayload).where((0, drizzle_orm_1.eq)(schema_js_1.escalations.id, id));
        return this.formatEscalation(id);
    }
    static async addComment(escalationId, adminId, content, isInternal = false) {
        const [comment] = await database_js_1.db
            .insert(schema_js_1.escalationComments)
            .values({
            escalationId,
            adminId,
            content,
            isInternal,
        })
            .returning();
        const admin = await database_js_1.db.query.admins.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.admins.id, adminId),
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
    static async create(data) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.escalations)
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
            await database_js_1.db
                .update(schema_js_1.groups)
                .set({ aiPausedUntil: pauseUntil })
                .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, data.group_id));
        }
        return this.formatEscalation(row.id);
    }
    static async resolve(id, adminId, notes) {
        const [esc] = await database_js_1.db
            .select()
            .from(schema_js_1.escalations)
            .where((0, drizzle_orm_1.eq)(schema_js_1.escalations.id, id))
            .limit(1);
        if (!esc)
            return null;
        await database_js_1.db
            .update(schema_js_1.escalations)
            .set({
            status: 'resolved',
            resolvedAt: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.escalations.id, id));
        if (notes) {
            await database_js_1.db.insert(schema_js_1.escalationComments).values({
                escalationId: id,
                adminId,
                content: `[Resolution Notes]: ${notes}`,
                isInternal: true,
            });
        }
        // Resume AI for group if no other open escalations exist for that group
        if (esc.groupId) {
            const otherOpen = await database_js_1.db
                .select({ id: schema_js_1.escalations.id })
                .from(schema_js_1.escalations)
                .where((0, drizzle_orm_1.sql) `${schema_js_1.escalations.groupId} = ${esc.groupId} AND ${schema_js_1.escalations.status} IN ('open', 'in_progress') AND ${schema_js_1.escalations.id} != ${id}`);
            if (otherOpen.length === 0) {
                await database_js_1.db
                    .update(schema_js_1.groups)
                    .set({ aiPausedUntil: null })
                    .where((0, drizzle_orm_1.eq)(schema_js_1.groups.id, esc.groupId));
            }
        }
        return this.formatEscalation(id);
    }
}
exports.EscalationsService = EscalationsService;
