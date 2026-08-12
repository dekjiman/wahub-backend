import { db } from '../../config/database.js';
import { admins } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../utils/password.js';

export class AdminsService {
  private static formatAdmin(row: typeof admins.$inferSelect) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar_url: row.avatarUrl,
      phone: row.phone,
      status: row.status as 'active' | 'inactive',
      last_login_at: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
      created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  static async list() {
    const rows = await db.select().from(admins);
    return rows.map((r) => this.formatAdmin(r));
  }

  static async create(data: {
    name: string;
    email: string;
    password: string;
    role: any;
    phone?: string;
    avatar_url?: string;
  }) {
    const passwordHash = await hashPassword(data.password);
    const [row] = await db
      .insert(admins)
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

  static async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: any;
      phone?: string | null;
      avatar_url?: string | null;
      status?: string;
    }
  ) {
    const updatePayload: any = { updatedAt: new Date() };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email.toLowerCase();
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.avatar_url !== undefined) updatePayload.avatarUrl = data.avatar_url;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.password) {
      updatePayload.passwordHash = await hashPassword(data.password);
    }

    const [row] = await db
      .update(admins)
      .set(updatePayload)
      .where(eq(admins.id, id))
      .returning();

    return row ? this.formatAdmin(row) : null;
  }

  static async delete(id: string) {
    const [deleted] = await db
      .delete(admins)
      .where(eq(admins.id, id))
      .returning();

    return Boolean(deleted);
  }
}
