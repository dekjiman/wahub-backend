"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalController = void 0;
const internal_service_js_1 = require("./internal.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class InternalController {
    static async getEvent(req, res) {
        const event = await internal_service_js_1.InternalService.getEventById(req.params.id);
        if (!event) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Event not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, event);
    }
    static async createAiAnalysis(req, res) {
        try {
            const result = await internal_service_js_1.InternalService.createAiAnalysis(req.body);
            return api_response_js_1.ApiResponse.success(res, result, 201);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, { code: 'CREATE_FAILED', message: error.message || 'Failed to create AI analysis' }, 400);
        }
    }
    static async createModerationAlert(req, res) {
        try {
            const result = await internal_service_js_1.InternalService.createModerationAlert(req.body);
            return api_response_js_1.ApiResponse.success(res, result, 201);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, { code: 'CREATE_FAILED', message: error.message || 'Failed to create moderation alert' }, 400);
        }
    }
    static async createEscalation(req, res) {
        try {
            const result = await internal_service_js_1.InternalService.createEscalation(req.body);
            return api_response_js_1.ApiResponse.success(res, result, 201);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, { code: 'CREATE_FAILED', message: error.message || 'Failed to create escalation' }, 400);
        }
    }
    static async createWorkflowRun(req, res) {
        try {
            const result = await internal_service_js_1.InternalService.createWorkflowRun(req.body);
            return api_response_js_1.ApiResponse.success(res, result, 201);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, { code: 'CREATE_FAILED', message: error.message || 'Failed to record workflow run' }, 400);
        }
    }
}
exports.InternalController = InternalController;
