import { db } from '../../config/database.js';
import { admins } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { generateToken, verifyToken } from '../../utils/jwt.js';
import { getRolePermissions } from '../../middleware/permission.middleware.js';

export class AuthService {
  static async login(email: string, pass: string) {
    const user = await db.query.admins.findFirst({
      where: eq(admins.email, email.toLowerCase()),
    });

    if (!user) {
      return null;
    }

    const isMatch = await comparePassword(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    // Update lastLoginAt
    await db
      .update(admins)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(admins.id, user.id));

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const permissions = getRolePermissions(user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatarUrl,
        permissions,
      },
    };
  }

  static async me(adminId: string) {
    const user = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!user) return null;

    const permissions = getRolePermissions(user.role);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl,
      permissions,
    };
  }

  static async forgotPassword(email: string) {
    const user = await db.query.admins.findFirst({
      where: eq(admins.email, email.toLowerCase()),
    });

    if (!user) return false;
    // In production: send reset email with token
    return true;
  }

  static async resetPassword(token: string, newPass: string) {
    try {
      const payload = verifyToken(token);
      const newHash = await hashPassword(newPass);
      await db
        .update(admins)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(admins.id, payload.sub));
      return true;
    } catch {
      return false;
    }
  }
}
