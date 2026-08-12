import { Router } from 'express';
import { WebhooksController } from './webhooks.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { evolutionGoWebhookSchema } from './webhooks.schema.js';

const router = Router();

// Public endpoint called by Evolution Go (no JWT).
router.post(
  '/evolution-go',
  validateRequest(evolutionGoWebhookSchema),
  WebhooksController.receiveEvolutionGo
);

export default router;
