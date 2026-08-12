import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { updateSettingSchema } from './settings.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('settings.view'), SettingsController.list);
router.patch(
  '/:key',
  requirePermission('settings.edit'),
  validateRequest(updateSettingSchema),
  auditLog('update_setting', 'system_setting'),
  SettingsController.update
);

export default router;
