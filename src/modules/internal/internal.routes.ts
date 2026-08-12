import { Router } from 'express';
import { InternalController } from './internal.controller.js';
import { internalAuthMiddleware } from '../../middleware/internal-auth.middleware.js';

const router = Router();

// Protect all internal endpoints with internalAuthMiddleware
router.use(internalAuthMiddleware);

router.get('/events/:id', InternalController.getEvent);
router.post('/ai-analyses', InternalController.createAiAnalysis);
router.post('/moderation-alerts', InternalController.createModerationAlert);
router.post('/escalations', InternalController.createEscalation);
router.post('/workflow-runs', InternalController.createWorkflowRun);

export default router;
