import { Router } from 'express';
import { IntegrationsController } from './integrations.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/',
  requirePermission('integration.view'),
  IntegrationsController.list
);
router.post(
  '/:id/refresh',
  requirePermission('integration.refresh'),
  auditLog('refresh', 'integration'),
  IntegrationsController.refresh
);

export default router;
