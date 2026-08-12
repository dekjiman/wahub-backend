import { db } from '../../config/database.js';
import { systemSettings } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export class SettingsService {
  private static formatSetting(row: typeof systemSettings.$inferSelect) {
    return {
      key: row.key,
      value: row.value || '',
      type: (row.type || 'string') as 'string' | 'number' | 'boolean' | 'json',
      category: row.category || 'general',
      description: row.description,
    };
  }

  static async list() {
    const rows = await db.select().from(systemSettings);
    return rows.map((r) => this.formatSetting(r));
  }

  static async update(key: string, value: string, adminId?: string) {
    const [row] = await db
      .insert(systemSettings)
      .values({
        key,
        value,
        updatedBy: adminId || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
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
