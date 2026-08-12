import { Router } from 'express';
import { BroadcastsController } from './broadcasts.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createBroadcastSchema,
  updateBroadcastStatusSchema,
} from './broadcasts.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('broadcast.view'), BroadcastsController.list);
router.get('/:id', requirePermission('broadcast.view'), BroadcastsController.getById);
router.get(
  '/:id/recipients',
  requirePermission('broadcast.view'),
  BroadcastsController.getRecipients
);
router.post(
  '/',
  requirePermission('broadcast.create'),
  validateRequest(createBroadcastSchema),
  auditLog('create', 'broadcast'),
  BroadcastsController.create
);
router.patch(
  '/:id/status',
  requirePermission('broadcast.create'),
  validateRequest(updateBroadcastStatusSchema),
  auditLog('update_status', 'broadcast'),
  BroadcastsController.updateStatus
);
router.post(
  '/:id/approve',
  requirePermission('broadcast.approve'),
  auditLog('approve', 'broadcast'),
  BroadcastsController.approve
);
router.post(
  '/:id/send',
  requirePermission('broadcast.approve'),
  auditLog('send', 'broadcast'),
  BroadcastsController.send
);

export default router;

