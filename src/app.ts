import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ApiResponse } from './utils/api-response.js';
import { WebhookService } from './services/webhook.service.js';
import { swaggerSpec } from './config/swagger.js';

import authRoutes from './modules/auth/auth.routes.js';
import adminsRoutes from './modules/admins/admins.routes.js';
import membersRoutes from './modules/members/members.routes.js';
import communitiesRoutes from './modules/communities/communities.routes.js';
import groupsRoutes from './modules/groups/groups.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import broadcastsRoutes from './modules/broadcasts/broadcasts.routes.js';
import moderationRoutes from './modules/moderation/moderation.routes.js';
import escalationsRoutes from './modules/escalations/escalations.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import chatLogsRoutes from './modules/chat-logs/chat-logs.routes.js';
import integrationsRoutes from './modules/integrations/integrations.routes.js';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes.js';
import workflowsRoutes from './modules/workflows/workflows.routes.js';
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes.js';
import webhooksRoutes from './modules/webhooks/webhooks.routes.js';
import internalRoutes from './modules/internal/internal.routes.js';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get(['/health', '/api/v1/health'], (req, res) => {
  return ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger / OpenAPI docs
app.get(['/api/docs', '/api-docs/json'], (req, res) => {
  return res.json(swaggerSpec);
});
app.use(['/api-docs', '/docs', '/api/docs/ui'], swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// Webhook endpoints
const webhookHandler = async (req: express.Request, res: express.Response) => {
  try {
    await WebhookService.handleEvent(req.body);
    return ApiResponse.success(res, { received: true });
  } catch (error) {
    return ApiResponse.error(res, { code: 'WEBHOOK_ERROR', message: 'Failed to process webhook' }, 500);
  }
};
app.post('/webhook/evolution', webhookHandler);
app.post('/api/v1/webhook/evolution', webhookHandler);

// Internal API Router (for n8n & automated service orchestration)
app.use('/api/internal', internalRoutes);

// API v1 Router
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/admins', adminsRoutes);
v1Router.use('/members', membersRoutes);
v1Router.use('/communities', communitiesRoutes);
v1Router.use('/groups', groupsRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/broadcasts', broadcastsRoutes);
v1Router.use('/moderation', moderationRoutes);
v1Router.use('/escalations', escalationsRoutes);
v1Router.use('/settings', settingsRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/chat-logs', chatLogsRoutes);
v1Router.use('/integrations', integrationsRoutes);
v1Router.use('/whatsapp', whatsappRoutes);
v1Router.use('/workflows', workflowsRoutes);
v1Router.use('/workflow-runs', workflowsRoutes);
v1Router.use('/audit-logs', auditLogsRoutes);
v1Router.use('/webhooks', webhooksRoutes);
v1Router.use('/internal', internalRoutes);

app.use('/api/v1', v1Router);


// Global Error Handler
app.use(errorHandler);

export { app };
