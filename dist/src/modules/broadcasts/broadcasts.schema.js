"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBroadcastStatusSchema = exports.createBroadcastSchema = void 0;
const zod_1 = require("zod");
exports.createBroadcastSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    content: zod_1.z.string().min(1, 'Content is required'),
    message_type: zod_1.z.enum(['text', 'image', 'video', 'document']).optional().default('text'),
    media_url: zod_1.z.string().optional(),
    target_type: zod_1.z.enum(['community', 'group', 'member']),
    target_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one target ID is required'),
    scheduled_at: zod_1.z.string().optional(),
});
exports.updateBroadcastStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'draft',
        'pending_approval',
        'approved',
        'sending',
        'sent',
        'failed',
    ]),
});
