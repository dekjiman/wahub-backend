import { z } from 'zod';

export const createGroupSchema = z.object({
  whatsapp_group_jid: z.string().optional(),
  name: z.string().min(1, 'Group name is required'),
  community_id: z.string().optional(),
  description: z.string().optional(),
  group_type: z.enum(['regular', 'announcement', 'support']).optional(),
  assigned_admin_id: z.string().uuid().nullable().optional(),
  ai_enabled: z.boolean().optional(),
  auto_welcome: z.boolean().optional(),
  auto_faq: z.boolean().optional(),
  auto_moderation: z.boolean().optional(),
  max_members: z.number().optional(),
  instance_name: z.string().optional(),
});

export const updateGroupSchema = z.object({
  community_id: z.string().nullable().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  group_type: z.enum(['regular', 'announcement', 'support']).optional(),
  assigned_admin_id: z.string().uuid().nullable().optional(),
  ai_enabled: z.boolean().optional(),
  auto_welcome: z.boolean().optional(),
  auto_faq: z.boolean().optional(),
  auto_moderation: z.boolean().optional(),
  max_members: z.number().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const pauseAiSchema = z.object({
  minutes: z.number().min(1, 'Minutes must be at least 1').default(60),
});

export const syncFromWhatsAppSchema = z.object({
  instance_name: z.string().optional(),
});

export const sendMessageSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'document', 'audio']).default('text'),
  text: z.string().min(1, 'Message text is required'),
  media_url: z.string().url().optional(),
  instance_name: z.string().optional(),
});

