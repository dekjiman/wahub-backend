import { Router } from 'express';
import { MembersController } from './members.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createMemberSchema,
  updateMemberSchema,
  issueWarningSchema,
} from './members.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('member.view'), MembersController.list);
router.post(
  '/',
  requirePermission('member.create'),
  validateRequest(createMemberSchema),
  auditLog('create', 'member'),
  MembersController.create
);
router.patch(
  '/:id',
  requirePermission('member.edit'),
  validateRequest(updateMemberSchema),
  auditLog('update', 'member'),
  MembersController.update
);
router.get(
  '/:id/groups',
  requirePermission('member.view'),
  MembersController.getGroups
);
router.get(
  '/:id/warnings',
  requirePermission('member.view'),
  MembersController.getWarnings
);
router.post(
  '/:id/warnings',
  requirePermission('member.warning'),
  validateRequest(issueWarningSchema),
  auditLog('warning', 'member'),
  MembersController.issueWarning
);
router.get(
  '/:id/messages',
  requirePermission('member.view'),
  MembersController.getMessages
);

export default router;
