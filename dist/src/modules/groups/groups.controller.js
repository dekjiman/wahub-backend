"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsController = void 0;
const groups_service_js_1 = require("./groups.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
const env_js_1 = require("../../config/env.js");
class GroupsController {
    static async list(req, res) {
        const list = await groups_service_js_1.GroupsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async getById(req, res) {
        const group = await groups_service_js_1.GroupsService.getById(req.params.id);
        if (!group) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, group);
    }
    static async create(req, res) {
        try {
            const group = await groups_service_js_1.GroupsService.create(req.body);
            return api_response_js_1.ApiResponse.success(res, group, 201);
        }
        catch (error) {
            if (error?.code === '23505') {
                return api_response_js_1.ApiResponse.error(res, {
                    code: 'GROUP_EXISTS',
                    message: 'WhatsApp Group JID already exists',
                    field: 'whatsapp_group_jid',
                }, 409);
            }
            return api_response_js_1.ApiResponse.error(res, {
                code: 'CREATE_FAILED',
                message: error.message || 'Failed to create group',
            }, 400);
        }
    }
    static async update(req, res) {
        const group = await groups_service_js_1.GroupsService.update(req.params.id, req.body);
        if (!group) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, group);
    }
    static async delete(req, res) {
        const success = await groups_service_js_1.GroupsService.delete(req.params.id);
        if (!success) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        return api_response_js_1.ApiResponse.noContent(res);
    }
    static async getMembers(req, res) {
        const membersList = await groups_service_js_1.GroupsService.getMembers(req.params.id);
        return api_response_js_1.ApiResponse.success(res, membersList);
    }
    static async syncMembers(req, res) {
        try {
            const result = await groups_service_js_1.GroupsService.syncParticipants(req.params.id, req.body.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE);
            return api_response_js_1.ApiResponse.success(res, result);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SYNC_FAILED',
                message: error.message || 'Failed to sync members from WhatsApp',
            }, 400);
        }
    }
    static async getMetrics(req, res) {
        const metrics = await groups_service_js_1.GroupsService.getMetrics(req.params.id);
        if (!metrics) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, metrics);
    }
    static async pauseAi(req, res) {
        const { minutes } = req.body;
        const group = await groups_service_js_1.GroupsService.pauseAi(req.params.id, minutes || 60);
        if (!group) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, group);
    }
    static async resumeAi(req, res) {
        const group = await groups_service_js_1.GroupsService.resumeAi(req.params.id);
        if (!group) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, group);
    }
    static async syncFromWhatsApp(req, res) {
        try {
            const result = await groups_service_js_1.GroupsService.syncFromWhatsApp(req.body.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE);
            return api_response_js_1.ApiResponse.success(res, result);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SYNC_FAILED',
                message: error.message || 'Failed to sync groups from WhatsApp',
            }, 400);
        }
    }
    static async getMessages(req, res) {
        const groupId = req.params.id;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const direction = req.query.direction || undefined;
        const type = req.query.type || undefined;
        const group = await groups_service_js_1.GroupsService.getById(groupId);
        if (!group) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
        }
        const result = await groups_service_js_1.GroupsService.getGroupMessages(groupId, {
            page,
            limit,
            direction,
            type,
        });
        return res.status(200).json({
            success: true,
            data: result.data,
            meta: result.meta,
        });
    }
    static async sendMessage(req, res) {
        try {
            const groupId = req.params.id;
            const adminId = req.user?.adminId || req.user?.id;
            const result = await groups_service_js_1.GroupsService.sendGroupMessage(groupId, req.body, adminId);
            return api_response_js_1.ApiResponse.success(res, result, 201);
        }
        catch (error) {
            const statusCode = error.message === 'Group not found' ? 404 : 400;
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SEND_FAILED',
                message: error.message || 'Failed to send message',
            }, statusCode);
        }
    }
}
exports.GroupsController = GroupsController;
