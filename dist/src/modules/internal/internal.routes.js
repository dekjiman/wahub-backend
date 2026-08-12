"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const internal_controller_js_1 = require("./internal.controller.js");
const internal_auth_middleware_js_1 = require("../../middleware/internal-auth.middleware.js");
const router = (0, express_1.Router)();
// Protect all internal endpoints with internalAuthMiddleware
router.use(internal_auth_middleware_js_1.internalAuthMiddleware);
router.get('/events/:id', internal_controller_js_1.InternalController.getEvent);
router.post('/ai-analyses', internal_controller_js_1.InternalController.createAiAnalysis);
router.post('/moderation-alerts', internal_controller_js_1.InternalController.createModerationAlert);
router.post('/escalations', internal_controller_js_1.InternalController.createEscalation);
router.post('/workflow-runs', internal_controller_js_1.InternalController.createWorkflowRun);
exports.default = router;
