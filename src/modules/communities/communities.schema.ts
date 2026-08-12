import { z } from 'zod';

export const createCommunitySchema = z.object({
  name: z.string().min(1, 'Community name is required'),
  description: z.string().optional(),
  area: z.string().nullable().optional(),
  whatsapp_community_id: z.string().nullable().optional(),
  cover_image_url: z.string().optional(),
  assigned_admin_id: z.string().uuid().nullable().optional(),
  instance_name: z.string().optional(),
});

export const updateCommunitySchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  whatsapp_community_id: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  assigned_admin_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const syncCommunitySchema = z.object({
  instance_name: z.string().min(1, 'Instance name is required'),
  description: z.string().optional(),
  group_jids: z.array(z.string()).min(1, 'At least one group JID required'),
});

export const syncFromWhatsAppSchema = z.object({
  instance_name: z.string().optional(),
});

export const addGroupsToCommunitySchema = z.object({
  instance_name: z.string().min(1, 'Instance name is required'),
  group_jids: z.array(z.string()).min(1, 'At least one group JID required'),
});

export const removeGroupsFromCommunitySchema = z.object({
  instance_name: z.string().min(1, 'Instance name is required'),
  group_jids: z.array(z.string()).min(1, 'At least one group JID required'),
});
