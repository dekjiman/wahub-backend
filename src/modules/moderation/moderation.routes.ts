import { Router } from 'express';
import { ModerationController } from './moderation.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { executeModerationSchema } from './moderation.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/alerts', requirePermission('moderation.view'), ModerationController.list);
router.get(
  '/alerts/:id',
  requirePermission('moderation.view'),
  ModerationController.getById
);
router.post(
  '/alerts/:id/approve',
  requirePermission('moderation.approve'),
  auditLog('approve', 'moderation_alert'),
  ModerationController.approve
);
router.post(
  '/alerts/:id/reject',
  requirePermission('moderation.reject'),
  auditLog('reject', 'moderation_alert'),
  ModerationController.reject
);
router.post(
  '/alerts/:id/execute',
  requirePermission('moderation.execute'),
  validateRequest(executeModerationSchema),
  auditLog('execute', 'moderation_alert'),
  ModerationController.execute
);

export default router;
