"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_js_1 = require("../../config/database.js");
const schema_js_1 = require("../../../drizzle/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const password_js_1 = require("../../utils/password.js");
const jwt_js_1 = require("../../utils/jwt.js");
const permission_middleware_js_1 = require("../../middleware/permission.middleware.js");
class AuthService {
    static async login(email, pass) {
        const user = await database_js_1.db.query.admins.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.admins.email, email.toLowerCase()),
        });
        if (!user) {
            return null;
        }
        const isMatch = await (0, password_js_1.comparePassword)(pass, user.passwordHash);
        if (!isMatch) {
            return null;
        }
        // Update lastLoginAt
        await database_js_1.db
            .update(schema_js_1.admins)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_js_1.admins.id, user.id));
        const token = (0, jwt_js_1.generateToken)({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        const permissions = (0, permission_middleware_js_1.getRolePermissions)(user.role);
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
    static async me(adminId) {
        const user = await database_js_1.db.query.admins.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.admins.id, adminId),
        });
        if (!user)
            return null;
        const permissions = (0, permission_middleware_js_1.getRolePermissions)(user.role);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar_url: user.avatarUrl,
            permissions,
        };
    }
    static async forgotPassword(email) {
        const user = await database_js_1.db.query.admins.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_js_1.admins.email, email.toLowerCase()),
        });
        if (!user)
            return false;
        // In production: send reset email with token
        return true;
    }
    static async resetPassword(token, newPass) {
        try {
            const payload = (0, jwt_js_1.verifyToken)(token);
            const newHash = await (0, password_js_1.hashPassword)(newPass);
            await database_js_1.db
                .update(schema_js_1.admins)
                .set({ passwordHash: newHash, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_js_1.admins.id, payload.sub));
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.AuthService = AuthService;
