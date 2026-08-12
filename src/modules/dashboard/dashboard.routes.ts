import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/summary',
  requirePermission('dashboard.view'),
  DashboardController.summary
);
router.get(
  '/health',
  requirePermission('dashboard.view'),
  DashboardController.health
);
router.get(
  '/recent-activities',
  requirePermission('dashboard.view'),
  DashboardController.recentActivities
);

export default router;
