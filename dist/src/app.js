"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cors_js_1 = require("./config/cors.js");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const api_response_js_1 = require("./utils/api-response.js");
const webhook_service_js_1 = require("./services/webhook.service.js");
const swagger_js_1 = require("./config/swagger.js");
const auth_routes_js_1 = __importDefault(require("./modules/auth/auth.routes.js"));
const admins_routes_js_1 = __importDefault(require("./modules/admins/admins.routes.js"));
const members_routes_js_1 = __importDefault(require("./modules/members/members.routes.js"));
const communities_routes_js_1 = __importDefault(require("./modules/communities/communities.routes.js"));
const groups_routes_js_1 = __importDefault(require("./modules/groups/groups.routes.js"));
const dashboard_routes_js_1 = __importDefault(require("./modules/dashboard/dashboard.routes.js"));
const broadcasts_routes_js_1 = __importDefault(require("./modules/broadcasts/broadcasts.routes.js"));
const moderation_routes_js_1 = __importDefault(require("./modules/moderation/moderation.routes.js"));
const escalations_routes_js_1 = __importDefault(require("./modules/escalations/escalations.routes.js"));
const settings_routes_js_1 = __importDefault(require("./modules/settings/settings.routes.js"));
const analytics_routes_js_1 = __importDefault(require("./modules/analytics/analytics.routes.js"));
const chat_logs_routes_js_1 = __importDefault(require("./modules/chat-logs/chat-logs.routes.js"));
const integrations_routes_js_1 = __importDefault(require("./modules/integrations/integrations.routes.js"));
const whatsapp_routes_js_1 = __importDefault(require("./modules/whatsapp/whatsapp.routes.js"));
const workflows_routes_js_1 = __importDefault(require("./modules/workflows/workflows.routes.js"));
const audit_logs_routes_js_1 = __importDefault(require("./modules/audit-logs/audit-logs.routes.js"));
const webhooks_routes_js_1 = __importDefault(require("./modules/webhooks/webhooks.routes.js"));
const internal_routes_js_1 = __importDefault(require("./modules/internal/internal.routes.js"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)(cors_js_1.corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
app.get(['/health', '/api/v1/health'], (req, res) => {
    return api_response_js_1.ApiResponse.success(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// Swagger / OpenAPI docs
app.get(['/api/docs', '/api-docs/json'], (req, res) => {
    return res.json(swagger_js_1.swaggerSpec);
});
app.use(['/api-docs', '/docs', '/api/docs/ui'], swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
// Webhook endpoints
const webhookHandler = async (req, res) => {
    try {
        await webhook_service_js_1.WebhookService.handleEvent(req.body);
        return api_response_js_1.ApiResponse.success(res, { received: true });
    }
    catch (error) {
        return api_response_js_1.ApiResponse.error(res, { code: 'WEBHOOK_ERROR', message: 'Failed to process webhook' }, 500);
    }
};
app.post('/webhook/evolution', webhookHandler);
app.post('/api/v1/webhook/evolution', webhookHandler);
// Internal API Router (for n8n & automated service orchestration)
app.use('/api/internal', internal_routes_js_1.default);
// API v1 Router
const v1Router = express_1.default.Router();
v1Router.use('/auth', auth_routes_js_1.default);
v1Router.use('/admins', admins_routes_js_1.default);
v1Router.use('/members', members_routes_js_1.default);
v1Router.use('/communities', communities_routes_js_1.default);
v1Router.use('/groups', groups_routes_js_1.default);
v1Router.use('/dashboard', dashboard_routes_js_1.default);
v1Router.use('/broadcasts', broadcasts_routes_js_1.default);
v1Router.use('/moderation', moderation_routes_js_1.default);
v1Router.use('/escalations', escalations_routes_js_1.default);
v1Router.use('/settings', settings_routes_js_1.default);
v1Router.use('/analytics', analytics_routes_js_1.default);
v1Router.use('/chat-logs', chat_logs_routes_js_1.default);
v1Router.use('/integrations', integrations_routes_js_1.default);
v1Router.use('/whatsapp', whatsapp_routes_js_1.default);
v1Router.use('/workflows', workflows_routes_js_1.default);
v1Router.use('/workflow-runs', workflows_routes_js_1.default);
v1Router.use('/audit-logs', audit_logs_routes_js_1.default);
v1Router.use('/webhooks', webhooks_routes_js_1.default);
v1Router.use('/internal', internal_routes_js_1.default);
app.use('/api/v1', v1Router);
// Global Error Handler
app.use(error_middleware_js_1.errorHandler);
