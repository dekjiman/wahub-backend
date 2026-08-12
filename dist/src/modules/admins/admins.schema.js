"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSchema = exports.createAdminSchema = void 0;
const zod_1 = require("zod");
exports.createAdminSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum([
        'super_admin',
        'business_manager',
        'area_manager',
        'support',
        'viewer',
    ]),
    phone: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().optional(),
});
exports.updateAdminSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z
        .enum([
        'super_admin',
        'business_manager',
        'area_manager',
        'support',
        'viewer',
    ])
        .optional(),
    phone: zod_1.z.string().nullable().optional(),
    avatar_url: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
});
