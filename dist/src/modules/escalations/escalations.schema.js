"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEscalationSchema = exports.addEscalationCommentSchema = exports.updateEscalationStatusSchema = exports.assignEscalationSchema = void 0;
const zod_1 = require("zod");
exports.assignEscalationSchema = zod_1.z.object({
    admin_id: zod_1.z.string().uuid('Invalid Admin ID'),
});
exports.updateEscalationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'closed']),
});
exports.addEscalationCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment content is required'),
    is_internal: zod_1.z.boolean().optional().default(false),
});
exports.createEscalationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    group_id: zod_1.z.string().uuid().optional(),
    member_id: zod_1.z.string().uuid().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
});
