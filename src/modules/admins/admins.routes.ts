import { Router } from 'express';
import { AdminsController } from './admins.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createAdminSchema, updateAdminSchema } from './admins.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('admin.view'), AdminsController.list);
router.post(
  '/',
  requirePermission('admin.create'),
  validateRequest(createAdminSchema),
  auditLog('create', 'admin'),
  AdminsController.create
);
router.patch(
  '/:id',
  requirePermission('admin.edit'),
  validateRequest(updateAdminSchema),
  auditLog('update', 'admin'),
  AdminsController.update
);
router.delete(
  '/:id',
  requirePermission('admin.delete'),
  auditLog('delete', 'admin'),
  AdminsController.delete
);

export default router;
