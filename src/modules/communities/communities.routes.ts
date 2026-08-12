import { Router } from 'express';
import { CommunitiesController } from './communities.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createCommunitySchema,
  updateCommunitySchema,
  syncCommunitySchema,
  syncFromWhatsAppSchema,
  addGroupsToCommunitySchema,
  removeGroupsFromCommunitySchema,
} from './communities.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('community.view'), CommunitiesController.list);
router.post(
  '/',
  requirePermission('community.create'),
  validateRequest(createCommunitySchema),
  auditLog('create', 'community'),
  CommunitiesController.create
);
router.post(
  '/sync',
  requirePermission('community.edit'),
  validateRequest(syncFromWhatsAppSchema),
  auditLog('sync', 'community'),
  CommunitiesController.syncFromWhatsApp
);
router.get('/:id', requirePermission('community.view'), CommunitiesController.getById);
router.patch(
  '/:id',
  requirePermission('community.edit'),
  validateRequest(updateCommunitySchema),
  auditLog('update', 'community'),
  CommunitiesController.update
);
router.delete(
  '/:id',
  requirePermission('community.delete'),
  auditLog('delete', 'community'),
  CommunitiesController.delete
);
router.get(
  '/:id/groups',
  requirePermission('group.view'),
  CommunitiesController.getGroups
);

// WhatsApp Community sync endpoints (Evolution Go)
router.post(
  '/:id/sync',
  requirePermission('community.edit'),
  validateRequest(syncCommunitySchema),
  auditLog('sync', 'community'),
  CommunitiesController.syncToWhatsApp
);
router.post(
  '/:id/add-groups',
  requirePermission('community.edit'),
  validateRequest(addGroupsToCommunitySchema),
  auditLog('update', 'community'),
  CommunitiesController.addGroupsToWhatsApp
);
router.post(
  '/:id/remove-groups',
  requirePermission('community.edit'),
  validateRequest(removeGroupsFromCommunitySchema),
  auditLog('update', 'community'),
  CommunitiesController.removeGroupsFromWhatsApp
);
router.get(
  '/whatsapp/list',
  requirePermission('community.view'),
  CommunitiesController.fetchFromWhatsApp
);
router.get(
  '/whatsapp/:communityJid',
  requirePermission('community.view'),
  CommunitiesController.getWhatsAppInfo
);

export default router;
