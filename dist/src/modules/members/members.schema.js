"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueWarningSchema = exports.updateMemberSchema = exports.createMemberSchema = void 0;
const zod_1 = require("zod");
exports.createMemberSchema = zod_1.z.object({
    whatsapp_number: zod_1.z.string().min(1, 'WhatsApp number is required'),
    display_name: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    area: zod_1.z.string().optional(),
    business_type: zod_1.z.string().optional(),
    business_name: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().optional(),
});
exports.updateMemberSchema = zod_1.z.object({
    display_name: zod_1.z.string().optional(),
    phone: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().email().nullable().optional(),
    area: zod_1.z.string().nullable().optional(),
    business_type: zod_1.z.string().nullable().optional(),
    business_name: zod_1.z.string().nullable().optional(),
    avatar_url: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'banned']).optional(),
});
exports.issueWarningSchema = zod_1.z.object({
    violation_type: zod_1.z.string().min(1, 'Violation type is required'),
    reason: zod_1.z.string().min(1, 'Reason is required'),
    group_id: zod_1.z.string().optional(),
    severity: zod_1.z.enum(['warning', 'strike', 'ban']).optional(),
});
