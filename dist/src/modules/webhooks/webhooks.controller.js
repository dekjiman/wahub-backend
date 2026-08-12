"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const webhooks_service_js_1 = require("./webhooks.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class WebhooksController {
    static async receiveEvolutionGo(req, res) {
        const result = await webhooks_service_js_1.WebhooksService.ingest(req.body);
        if (!result.stored) {
            return api_response_js_1.ApiResponse.success(res, {
                received: true,
                duplicate: Boolean(result.duplicate),
            });
        }
        webhooks_service_js_1.WebhooksService.scheduleProcessing(result.eventId);
        return api_response_js_1.ApiResponse.success(res, {
            received: true,
            duplicate: false,
            eventId: result.eventId,
        });
    }
}
exports.WebhooksController = WebhooksController;
