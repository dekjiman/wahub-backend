"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationsController = void 0;
const escalations_service_js_1 = require("./escalations.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class EscalationsController {
    static async list(req, res) {
        const list = await escalations_service_js_1.EscalationsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async getById(req, res) {
        const escalation = await escalations_service_js_1.EscalationsService.getById(req.params.id);
        if (!escalation) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Escalation not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, escalation);
    }
    static async getComments(req, res) {
        const comments = await escalations_service_js_1.EscalationsService.getComments(req.params.id);
        return api_response_js_1.ApiResponse.success(res, comments);
    }
    static async assign(req, res) {
        const escalation = await escalations_service_js_1.EscalationsService.assign(req.params.id, req.body.admin_id);
        if (!escalation) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Escalation not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, escalation);
    }
    static async updateStatus(req, res) {
        const escalation = await escalations_service_js_1.EscalationsService.updateStatus(req.params.id, req.body.status);
        if (!escalation) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Escalation not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, escalation);
    }
    static async addComment(req, res) {
        const adminId = req.user?.sub || 'system';
        const comment = await escalations_service_js_1.EscalationsService.addComment(req.params.id, adminId, req.body.content, req.body.is_internal);
        return api_response_js_1.ApiResponse.success(res, comment, 201);
    }
    static async create(req, res) {
        const result = await escalations_service_js_1.EscalationsService.create(req.body);
        return api_response_js_1.ApiResponse.success(res, result, 201);
    }
    static async resolve(req, res) {
        const adminId = req.user?.sub || 'system';
        const result = await escalations_service_js_1.EscalationsService.resolve(req.params.id, adminId, req.body?.notes);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Escalation not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
}
exports.EscalationsController = EscalationsController;
