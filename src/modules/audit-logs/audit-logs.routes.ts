import { Router } from 'express';
import { AuditLogsController } from './audit-logs.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('audit.view'), AuditLogsController.list);

export default router;
