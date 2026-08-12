"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsController = void 0;
const workflows_service_js_1 = require("./workflows.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class WorkflowsController {
    static async list(req, res) {
        const list = await workflows_service_js_1.WorkflowsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async retry(req, res) {
        const run = await workflows_service_js_1.WorkflowsService.retry(req.params.id);
        if (!run) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Workflow run not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, run);
    }
}
exports.WorkflowsController = WorkflowsController;
