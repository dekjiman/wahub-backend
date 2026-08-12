import { Router } from 'express';
import { ChatLogsController } from './chat-logs.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('group.view'), ChatLogsController.list);
router.get(
  '/member/:memberId',
  requirePermission('member.view'),
  ChatLogsController.getByMember
);
router.get('/:id', requirePermission('group.view'), ChatLogsController.getById);

export default router;
