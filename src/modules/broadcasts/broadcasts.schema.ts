import { z } from 'zod';

export const createBroadcastSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  message_type: z.enum(['text', 'image', 'video', 'document']).optional().default('text'),
  media_url: z.string().optional(),
  target_type: z.enum(['community', 'group', 'member']),
  target_ids: z.array(z.string().uuid()).min(1, 'At least one target ID is required'),
  scheduled_at: z.string().optional(),
});

export const updateBroadcastStatusSchema = z.object({
  status: z.enum([
    'draft',
    'pending_approval',
    'approved',
    'sending',
    'sent',
    'failed',
  ]),
});
