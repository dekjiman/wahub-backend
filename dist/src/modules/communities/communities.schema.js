"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeGroupsFromCommunitySchema = exports.addGroupsToCommunitySchema = exports.syncFromWhatsAppSchema = exports.syncCommunitySchema = exports.updateCommunitySchema = exports.createCommunitySchema = void 0;
const zod_1 = require("zod");
exports.createCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Community name is required'),
    description: zod_1.z.string().optional(),
    area: zod_1.z.string().nullable().optional(),
    whatsapp_community_id: zod_1.z.string().nullable().optional(),
    cover_image_url: zod_1.z.string().optional(),
    assigned_admin_id: zod_1.z.string().uuid().nullable().optional(),
    instance_name: zod_1.z.string().optional(),
});
exports.updateCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().nullable().optional(),
    area: zod_1.z.string().nullable().optional(),
    whatsapp_community_id: zod_1.z.string().nullable().optional(),
    cover_image_url: zod_1.z.string().nullable().optional(),
    assigned_admin_id: zod_1.z.string().uuid().nullable().optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
});
exports.syncCommunitySchema = zod_1.z.object({
    instance_name: zod_1.z.string().min(1, 'Instance name is required'),
    description: zod_1.z.string().optional(),
    group_jids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one group JID required'),
});
exports.syncFromWhatsAppSchema = zod_1.z.object({
    instance_name: zod_1.z.string().optional(),
});
exports.addGroupsToCommunitySchema = zod_1.z.object({
    instance_name: zod_1.z.string().min(1, 'Instance name is required'),
    group_jids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one group JID required'),
});
exports.removeGroupsFromCommunitySchema = zod_1.z.object({
    instance_name: zod_1.z.string().min(1, 'Instance name is required'),
    group_jids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one group JID required'),
});
