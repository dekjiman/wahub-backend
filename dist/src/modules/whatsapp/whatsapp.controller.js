"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const evolution_service_js_1 = require("../../services/evolution.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
const env_js_1 = require("../../config/env.js");
class WhatsappController {
    static async listInstances(req, res) {
        const instances = await evolution_service_js_1.EvolutionService.fetchInstances();
        return api_response_js_1.ApiResponse.success(res, instances || []);
    }
    static async listCommunities(req, res) {
        const instanceName = req.query.instance_name;
        if (!instanceName) {
            return api_response_js_1.ApiResponse.error(res, { code: 'VALIDATION_ERROR', message: 'instance_name is required' }, 400);
        }
        const communities = await evolution_service_js_1.EvolutionService.fetchCommunities(instanceName);
        return api_response_js_1.ApiResponse.success(res, communities || []);
    }
    static async listGroups(req, res) {
        const instanceName = req.query.instance_name;
        if (!instanceName) {
            return api_response_js_1.ApiResponse.error(res, { code: 'VALIDATION_ERROR', message: 'instance_name is required' }, 400);
        }
        const groups = await evolution_service_js_1.EvolutionService.fetchGroups(instanceName);
        return api_response_js_1.ApiResponse.success(res, groups || []);
    }
    static async getStatus(req, res) {
        const instanceName = req.query.instance_name;
        if (!instanceName) {
            return api_response_js_1.ApiResponse.error(res, { code: 'VALIDATION_ERROR', message: 'instance_name is required' }, 400);
        }
        const status = await evolution_service_js_1.EvolutionService.getConnectionState(instanceName);
        if (!status) {
            return api_response_js_1.ApiResponse.error(res, { code: 'INSTANCE_NOT_FOUND', message: `Instance "${instanceName}" not found` }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, status);
    }
    static async getQr(req, res) {
        const instanceName = req.query.instance_name;
        if (!instanceName) {
            return api_response_js_1.ApiResponse.error(res, { code: 'VALIDATION_ERROR', message: 'instance_name is required' }, 400);
        }
        const qr = await evolution_service_js_1.EvolutionService.getQr(instanceName);
        if (!qr) {
            return api_response_js_1.ApiResponse.error(res, { code: 'QR_UNAVAILABLE', message: 'QR code unavailable. Make sure the instance is disconnected first.' }, 409);
        }
        return api_response_js_1.ApiResponse.success(res, qr);
    }
    static async connect(req, res) {
        const { instance_name, webhook_url } = req.body;
        const result = await evolution_service_js_1.EvolutionService.connect(instance_name, webhook_url || env_js_1.env.EVOLUTION_WEBHOOK_URL);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'CONNECT_FAILED', message: `Failed to connect instance "${instance_name}"` }, 400);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
    static async pair(req, res) {
        const { instance_name, phone } = req.body;
        const result = await evolution_service_js_1.EvolutionService.pair(instance_name, phone);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'PAIR_FAILED', message: `Failed to pair instance "${instance_name}"` }, 400);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
    static async disconnect(req, res) {
        const { instance_name } = req.body;
        const result = await evolution_service_js_1.EvolutionService.disconnect(instance_name);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'DISCONNECT_FAILED', message: `Failed to disconnect instance "${instance_name}"` }, 400);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
    static async logout(req, res) {
        const { instance_name } = req.body;
        const result = await evolution_service_js_1.EvolutionService.logout(instance_name);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'LOGOUT_FAILED', message: `Failed to logout instance "${instance_name}"` }, 400);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
    static async delete(req, res) {
        const result = await evolution_service_js_1.EvolutionService.deleteInstance(req.params.instanceName);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'DELETE_FAILED', message: `Failed to delete instance "${req.params.instanceName}"` }, 400);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
    static async reconcile(req, res) {
        const instanceName = req.body.instance_name || env_js_1.env.EVOLUTION_DEFAULT_INSTANCE;
        const { ReconciliationService } = await import('../../services/reconciliation.service.js');
        const result = await ReconciliationService.runReconciliation(instanceName);
        return api_response_js_1.ApiResponse.success(res, result);
    }
}
exports.WhatsappController = WhatsappController;
