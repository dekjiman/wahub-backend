import { z } from 'zod';

export const createMemberSchema = z.object({
  whatsapp_number: z.string().min(1, 'WhatsApp number is required'),
  display_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  area: z.string().optional(),
  business_type: z.string().optional(),
  business_name: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const updateMemberSchema = z.object({
  display_name: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  area: z.string().nullable().optional(),
  business_type: z.string().nullable().optional(),
  business_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'banned']).optional(),
});

export const issueWarningSchema = z.object({
  violation_type: z.string().min(1, 'Violation type is required'),
  reason: z.string().min(1, 'Reason is required'),
  group_id: z.string().optional(),
  severity: z.enum(['warning', 'strike', 'ban']).optional(),
});
