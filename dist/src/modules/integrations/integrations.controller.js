"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsController = void 0;
const integrations_service_js_1 = require("./integrations.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class IntegrationsController {
    static async list(req, res) {
        const list = await integrations_service_js_1.IntegrationsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async refresh(req, res) {
        const integration = await integrations_service_js_1.IntegrationsService.refresh(req.params.id);
        if (!integration) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Integration not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, integration);
    }
}
exports.IntegrationsController = IntegrationsController;
