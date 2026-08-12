"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
class SettingsService {
    static formatSetting(row) {
        return {
            key: row.key,
            value: row.value || '',
            type: (row.type || 'string'),
            category: row.category || 'general',
            description: row.description,
        };
    }
    static async list() {
        const rows = await database_js_1.db.select().from(schema_js_1.systemSettings);
        return rows.map((r) => this.formatSetting(r));
    }
    static async update(key, value, adminId) {
        const [row] = await database_js_1.db
            .insert(schema_js_1.systemSettings)
            .values({
            key,
            value,
            updatedBy: adminId || null,
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: schema_js_1.systemSettings.key,
            set: {
                value,
                updatedBy: adminId || null,
                updatedAt: new Date(),
            },
        })
            .returning();
        return this.formatSetting(row);
    }
}
exports.SettingsService = SettingsService;
