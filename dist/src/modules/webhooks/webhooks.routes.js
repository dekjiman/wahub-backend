"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhooks_controller_js_1 = require("./webhooks.controller.js");
const validate_middleware_js_1 = require("../../middleware/validate.middleware.js");
const webhooks_schema_js_1 = require("./webhooks.schema.js");
const router = (0, express_1.Router)();
// Public endpoint called by Evolution Go (no JWT).
router.post('/evolution-go', (0, validate_middleware_js_1.validateRequest)(webhooks_schema_js_1.evolutionGoWebhookSchema), webhooks_controller_js_1.WebhooksController.receiveEvolutionGo);
exports.default = router;
