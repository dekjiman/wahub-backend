"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationController = void 0;
const moderation_service_js_1 = require("./moderation.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class ModerationController {
    static async list(req, res) {
        const list = await moderation_service_js_1.ModerationService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async getById(req, res) {
        const alert = await moderation_service_js_1.ModerationService.getById(req.params.id);
        if (!alert) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Moderation alert not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, alert);
    }
    static async approve(req, res) {
        const adminId = req.user?.sub || 'system';
        const alert = await moderation_service_js_1.ModerationService.approve(req.params.id, adminId);
        if (!alert) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Moderation alert not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, alert);
    }
    static async reject(req, res) {
        const adminId = req.user?.sub || 'system';
        const alert = await moderation_service_js_1.ModerationService.reject(req.params.id, adminId);
        if (!alert) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Moderation alert not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, alert);
    }
    static async execute(req, res) {
        const adminId = req.user?.sub || 'system';
        const alert = await moderation_service_js_1.ModerationService.execute(req.params.id, adminId, req.body?.action_taken);
        if (!alert) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Moderation alert not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, alert);
    }
}
exports.ModerationController = ModerationController;
