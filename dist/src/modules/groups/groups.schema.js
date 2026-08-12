"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.syncFromWhatsAppSchema = exports.pauseAiSchema = exports.updateGroupSchema = exports.createGroupSchema = void 0;
const zod_1 = require("zod");
exports.createGroupSchema = zod_1.z.object({
    whatsapp_group_jid: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Group name is required'),
    community_id: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    group_type: zod_1.z.enum(['regular', 'announcement', 'support']).optional(),
    assigned_admin_id: zod_1.z.string().uuid().nullable().optional(),
    ai_enabled: zod_1.z.boolean().optional(),
    auto_welcome: zod_1.z.boolean().optional(),
    auto_faq: zod_1.z.boolean().optional(),
    auto_moderation: zod_1.z.boolean().optional(),
    max_members: zod_1.z.number().optional(),
    instance_name: zod_1.z.string().optional(),
});
exports.updateGroupSchema = zod_1.z.object({
    community_id: zod_1.z.string().nullable().optional(),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().nullable().optional(),
    group_type: zod_1.z.enum(['regular', 'announcement', 'support']).optional(),
    assigned_admin_id: zod_1.z.string().uuid().nullable().optional(),
    ai_enabled: zod_1.z.boolean().optional(),
    auto_welcome: zod_1.z.boolean().optional(),
    auto_faq: zod_1.z.boolean().optional(),
    auto_moderation: zod_1.z.boolean().optional(),
    max_members: zod_1.z.number().nullable().optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
});
exports.pauseAiSchema = zod_1.z.object({
    minutes: zod_1.z.number().min(1, 'Minutes must be at least 1').default(60),
});
exports.syncFromWhatsAppSchema = zod_1.z.object({
    instance_name: zod_1.z.string().optional(),
});
exports.sendMessageSchema = zod_1.z.object({
    type: zod_1.z.enum(['text', 'image', 'video', 'document', 'audio']).default('text'),
    text: zod_1.z.string().min(1, 'Message text is required'),
    media_url: zod_1.z.string().url().optional(),
    instance_name: zod_1.z.string().optional(),
});
