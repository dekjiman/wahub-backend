import { Router } from 'express';
import { WorkflowsController } from './workflows.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('settings.view'), WorkflowsController.list);
router.post(
  '/:id/retry',
  requirePermission('settings.edit'),
  auditLog('retry', 'workflow_run'),
  WorkflowsController.retry
);

export default router;
