"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastsController = void 0;
const broadcasts_service_js_1 = require("./broadcasts.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class BroadcastsController {
    static async list(req, res) {
        const list = await broadcasts_service_js_1.BroadcastsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async getById(req, res) {
        const broadcast = await broadcasts_service_js_1.BroadcastsService.getById(req.params.id);
        if (!broadcast) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Broadcast not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, broadcast);
    }
    static async getRecipients(req, res) {
        const recipients = await broadcasts_service_js_1.BroadcastsService.getRecipients(req.params.id);
        return api_response_js_1.ApiResponse.success(res, recipients);
    }
    static async create(req, res) {
        const adminId = req.user?.sub || 'system';
        const broadcast = await broadcasts_service_js_1.BroadcastsService.create(adminId, req.body);
        return api_response_js_1.ApiResponse.success(res, broadcast, 201);
    }
    static async updateStatus(req, res) {
        const broadcast = await broadcasts_service_js_1.BroadcastsService.updateStatus(req.params.id, req.body.status);
        if (!broadcast) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Broadcast not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, broadcast);
    }
    static async approve(req, res) {
        const broadcast = await broadcasts_service_js_1.BroadcastsService.approve(req.params.id);
        if (!broadcast) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Broadcast not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, broadcast);
    }
    static async send(req, res) {
        const broadcast = await broadcasts_service_js_1.BroadcastsService.send(req.params.id);
        if (!broadcast) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Broadcast not found or cannot be sent' }, 400);
        }
        return api_response_js_1.ApiResponse.success(res, broadcast);
    }
}
exports.BroadcastsController = BroadcastsController;
