"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunitiesController = void 0;
const communities_service_js_1 = require("./communities.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
const env_js_1 = require("../../config/env.js");
class CommunitiesController {
    static async list(req, res) {
        const list = await communities_service_js_1.CommunitiesService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async getById(req, res) {
        const community = await communities_service_js_1.CommunitiesService.getById(req.params.id);
        if (!community) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Community not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, community);
    }
    static async create(req, res) {
        try {
            const community = await communities_service_js_1.CommunitiesService.create(req.body);
            return api_response_js_1.ApiResponse.success(res, community, 201);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'CREATE_FAILED',
                message: error.message || 'Failed to create community',
            }, 400);
        }
    }
    static async update(req, res) {
        const community = await communities_service_js_1.CommunitiesService.update(req.params.id, req.body);
        if (!community) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Community not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, community);
    }
    static async delete(req, res) {
        const success = await communities_service_js_1.CommunitiesService.delete(req.params.id);
        if (!success) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Community not found' }, 404);
        }
        return api_response_js_1.ApiResponse.noContent(res);
    }
    static async getGroups(req, res) {
        const groupsList = await communities_service_js_1.CommunitiesService.getGroups(req.params.id);
        return api_response_js_1.ApiResponse.success(res, groupsList);
    }
    static async syncToWhatsApp(req, res) {
        try {
            const result = await communities_service_js_1.CommunitiesService.syncToWhatsApp(req.params.id, req.body.instance_name, req.body.description, req.body.group_jids);
            return api_response_js_1.ApiResponse.success(res, result);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SYNC_FAILED',
                message: error.message,
            }, 400);
        }
    }
    static async addGroupsToWhatsApp(req, res) {
        try {
            const result = await communities_service_js_1.CommunitiesService.addGroupsToWhatsApp(req.params.id, req.body.instance_name, req.body.group_jids);
            return api_response_js_1.ApiResponse.success(res, result);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SYNC_FAILED',
                message: error.message,
            }, 400);
        }
    }
    static async removeGroupsFromWhatsApp(req, res) {
        try {
            const result = await communities_service_js_1.CommunitiesService.removeGroupsFromWhatsApp(req.params.id, req.body.instance_name, req.body.group_jids);
            return api_response_js_1.ApiResponse.success(res, result);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SYNC_FAILED',
                message: error.message,
            }, 400);
        }
    }
    static async fetchFromWhatsApp(req, res) {
        const communitiesList = await communities_service_js_1.CommunitiesService.fetchFromWhatsApp(req.query.instance_name);
        return api_response_js_1.ApiResponse.success(res, communitiesList);
    }
    static async syncFromWhatsApp(req, res) {
        try {
            const result = await communities_service_js_1.CommunitiesService.syncFromWhatsApp(req.body.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE);
            return api_response_js_1.ApiResponse.success(res, result);
        }
        catch (error) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'SYNC_FAILED',
                message: error.message || 'Failed to sync communities from WhatsApp',
            }, 400);
        }
    }
    static async getWhatsAppInfo(req, res) {
        const info = await communities_service_js_1.CommunitiesService.getWhatsAppInfo(req.query.instance_name, req.params.communityJid);
        if (!info) {
            return api_response_js_1.ApiResponse.error(res, {
                code: 'NOT_FOUND',
                message: 'Community not found on WhatsApp',
            }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, info);
    }
}
exports.CommunitiesController = CommunitiesController;
