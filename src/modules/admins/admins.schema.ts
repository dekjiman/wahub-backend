import { z } from 'zod';

export const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([
    'super_admin',
    'business_manager',
    'area_manager',
    'support',
    'viewer',
  ]),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const updateAdminSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z
    .enum([
      'super_admin',
      'business_manager',
      'area_manager',
      'support',
      'viewer',
    ])
    .optional(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
