import { z } from 'zod';

export const connectInstanceSchema = z.object({
  instance_name: z.string().min(1, 'Instance name is required'),
  webhook_url: z.string().url().optional(),
});

export const pairInstanceSchema = z.object({
  instance_name: z.string().min(1, 'Instance name is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

export const instanceNameSchema = z.object({
  instance_name: z.string().min(1, 'Instance name is required'),
});
