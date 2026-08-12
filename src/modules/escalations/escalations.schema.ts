import { z } from 'zod';

export const assignEscalationSchema = z.object({
  admin_id: z.string().uuid('Invalid Admin ID'),
});

export const updateEscalationStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const addEscalationCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  is_internal: z.boolean().optional().default(false),
});

export const createEscalationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  group_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
});

