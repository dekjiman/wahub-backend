import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/overview',
  requirePermission('dashboard.analytics'),
  AnalyticsController.overview
);
router.get(
  '/growth',
  requirePermission('dashboard.analytics'),
  AnalyticsController.growth
);
router.get(
  '/sentiment',
  requirePermission('dashboard.analytics'),
  AnalyticsController.sentiment
);
router.get(
  '/topics',
  requirePermission('dashboard.analytics'),
  AnalyticsController.topics
);
router.get(
  '/spam',
  requirePermission('dashboard.analytics'),
  AnalyticsController.spam
);
router.get(
  '/delivery',
  requirePermission('dashboard.analytics'),
  AnalyticsController.delivery
);
router.get(
  '/message-activity',
  requirePermission('dashboard.analytics'),
  AnalyticsController.messageActivity
);
router.get(
  '/heatmaps',
  requirePermission('dashboard.analytics'),
  AnalyticsController.heatmaps
);
router.get(
  '/moderation-summary',
  requirePermission('dashboard.analytics'),
  AnalyticsController.moderationSummary
);
router.get(
  '/export/members',
  requirePermission('dashboard.analytics'),
  AnalyticsController.exportMembers
);
router.get(
  '/export/messages',
  requirePermission('dashboard.analytics'),
  AnalyticsController.exportMessages
);
router.get(
  '/export/moderation',
  requirePermission('dashboard.analytics'),
  AnalyticsController.exportModeration
);

export default router;

