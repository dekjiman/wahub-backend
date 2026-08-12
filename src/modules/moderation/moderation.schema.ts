import { z } from 'zod';

export const executeModerationSchema = z.object({
  action_taken: z.string().optional().default('warned_member'),
});
