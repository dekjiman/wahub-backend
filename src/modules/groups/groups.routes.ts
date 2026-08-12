import { Router } from 'express';
import { GroupsController } from './groups.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createGroupSchema,
  updateGroupSchema,
  pauseAiSchema,
  syncFromWhatsAppSchema,
  sendMessageSchema,
} from './groups.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('group.view'), GroupsController.list);
router.post(
  '/sync',
  requirePermission('group.edit'),
  validateRequest(syncFromWhatsAppSchema),
  auditLog('sync', 'group'),
  GroupsController.syncFromWhatsApp
);
router.post(
  '/',
  requirePermission('group.create'),
  validateRequest(createGroupSchema),
  auditLog('create', 'group'),
  GroupsController.create
);
router.get('/:id', requirePermission('group.view'), GroupsController.getById);
router.patch(
  '/:id',
  requirePermission('group.edit'),
  validateRequest(updateGroupSchema),
  auditLog('update', 'group'),
  GroupsController.update
);
router.delete(
  '/:id',
  requirePermission('group.delete'),
  auditLog('delete', 'group'),
  GroupsController.delete
);
router.get(
  '/:id/members',
  requirePermission('group.view'),
  GroupsController.getMembers
);
router.get(
  '/:id/messages',
  requirePermission('group.view'),
  GroupsController.getMessages
);
router.post(
  '/:id/messages',
  requirePermission('group.edit'),
  validateRequest(sendMessageSchema),
  auditLog('send_message', 'group'),
  GroupsController.sendMessage
);
router.post(
  '/:id/sync-members',
  requirePermission('group.edit'),
  validateRequest(syncFromWhatsAppSchema),
  auditLog('sync', 'group'),
  GroupsController.syncMembers
);
router.get(
  '/:id/metrics',
  requirePermission('group.view'),
  GroupsController.getMetrics
);
router.post(
  '/:id/pause-ai',
  requirePermission('group.ai_control'),
  validateRequest(pauseAiSchema),
  auditLog('pause_ai', 'group'),
  GroupsController.pauseAi
);
router.post(
  '/:id/resume-ai',
  requirePermission('group.ai_control'),
  auditLog('resume_ai', 'group'),
  GroupsController.resumeAi
);

export default router;
