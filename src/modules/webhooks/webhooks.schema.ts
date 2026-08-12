import { z } from 'zod';

export const evolutionGoWebhookSchema = z
  .object({
    event: z.string().min(1, 'event is required'),
    data: z.unknown().optional(),
    instanceName: z.string().optional(),
    instanceId: z.string().optional(),
    instanceToken: z.string().optional(),
  })
  .passthrough();

export type EvolutionGoWebhookInput = z.infer<typeof evolutionGoWebhookSchema>;
