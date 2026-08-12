import { Router } from 'express';
import { EscalationsController } from './escalations.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  assignEscalationSchema,
  updateEscalationStatusSchema,
  addEscalationCommentSchema,
  createEscalationSchema,
} from './escalations.schema.js';

import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('escalation.view'), EscalationsController.list);
router.get('/:id', requirePermission('escalation.view'), EscalationsController.getById);
router.get(
  '/:id/comments',
  requirePermission('escalation.view'),
  EscalationsController.getComments
);
router.post(
  '/:id/assign',
  requirePermission('escalation.assign'),
  validateRequest(assignEscalationSchema),
  auditLog('assign', 'escalation'),
  EscalationsController.assign
);
router.patch(
  '/:id/status',
  requirePermission('escalation.update'),
  validateRequest(updateEscalationStatusSchema),
  auditLog('update_status', 'escalation'),
  EscalationsController.updateStatus
);
router.post(
  '/:id/comments',
  requirePermission('escalation.update'),
  validateRequest(addEscalationCommentSchema),
  auditLog('add_comment', 'escalation'),
  EscalationsController.addComment
);

router.post(
  '/',
  requirePermission('escalation.update'),
  validateRequest(createEscalationSchema),
  auditLog('create', 'escalation'),
  EscalationsController.create
);
router.post(
  '/:id/resolve',
  requirePermission('escalation.update'),
  auditLog('resolve', 'escalation'),
  EscalationsController.resolve
);

export default router;

