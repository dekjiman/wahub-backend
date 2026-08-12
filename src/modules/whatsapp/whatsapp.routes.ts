import { Router } from 'express';
import { WhatsappController } from './whatsapp.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  connectInstanceSchema,
  pairInstanceSchema,
  instanceNameSchema,
} from './whatsapp.schema.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/',
  requirePermission('integration.view'),
  WhatsappController.listInstances
);
router.get(
  '/communities',
  requirePermission('integration.view'),
  WhatsappController.listCommunities
);
router.get(
  '/groups',
  requirePermission('integration.view'),
  WhatsappController.listGroups
);
router.get(
  '/status',
  requirePermission('integration.view'),
  WhatsappController.getStatus
);
router.get(
  '/qr',
  requirePermission('integration.view'),
  WhatsappController.getQr
);
router.post(
  '/connect',
  requirePermission('integration.refresh'),
  validateRequest(connectInstanceSchema),
  auditLog('connect', 'whatsapp-instance'),
  WhatsappController.connect
);
router.post(
  '/pair',
  requirePermission('integration.refresh'),
  validateRequest(pairInstanceSchema),
  auditLog('connect', 'whatsapp-instance'),
  WhatsappController.pair
);
router.post(
  '/disconnect',
  requirePermission('integration.refresh'),
  validateRequest(instanceNameSchema),
  auditLog('disconnect', 'whatsapp-instance'),
  WhatsappController.disconnect
);
router.post(
  '/logout',
  requirePermission('integration.refresh'),
  validateRequest(instanceNameSchema),
  auditLog('logout', 'whatsapp-instance'),
  WhatsappController.logout
);
router.delete(
  '/:instanceName',
  requirePermission('integration.refresh'),
  auditLog('delete', 'whatsapp-instance'),
  WhatsappController.delete
);
router.post(
  '/reconcile',
  requirePermission('integration.refresh'),
  auditLog('reconcile', 'whatsapp-data'),
  WhatsappController.reconcile
);

export default router;

