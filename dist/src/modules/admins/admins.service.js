"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const password_js_1 = require("../../utils/password.js");
class AdminsService {
    static formatAdmin(row) {
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            avatar_url: row.avatarUrl,
            phone: row.phone,
            status: row.status,
            last_login_at: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
            created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        };
    }
    static async list() {
        const rows = await database_js_1.db.select().from(schema_js_1.admins);
        return rows.map((r) => this.formatAdmin(r));
    }
    static async create(data) {
        const passwordHash = await (0, password_js_1.hashPassword)(data.password);
        const [row] = await database_js_1.db
            .insert(schema_js_1.admins)
            .values({
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role: data.role,
            phone: data.phone || null,
            avatarUrl: data.avatar_url || null,
        })
            .returning();
        return this.formatAdmin(row);
    }
    static async update(id, data) {
        const updatePayload = { updatedAt: new Date() };
        if (data.name !== undefined)
            updatePayload.name = data.name;
        if (data.email !== undefined)
            updatePayload.email = data.email.toLowerCase();
        if (data.role !== undefined)
            updatePayload.role = data.role;
        if (data.phone !== undefined)
            updatePayload.phone = data.phone;
        if (data.avatar_url !== undefined)
            updatePayload.avatarUrl = data.avatar_url;
        if (data.status !== undefined)
            updatePayload.status = data.status;
        if (data.password) {
            updatePayload.passwordHash = await (0, password_js_1.hashPassword)(data.password);
        }
        const [row] = await database_js_1.db
            .update(schema_js_1.admins)
            .set(updatePayload)
            .where((0, drizzle_orm_1.eq)(schema_js_1.admins.id, id))
            .returning();
        return row ? this.formatAdmin(row) : null;
    }
    static async delete(id) {
        const [deleted] = await database_js_1.db
            .delete(schema_js_1.admins)
            .where((0, drizzle_orm_1.eq)(schema_js_1.admins.id, id))
            .returning();
        return Boolean(deleted);
    }
}
exports.AdminsService = AdminsService;
