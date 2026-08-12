import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.string({ required_error: 'Value is required' }),
});
