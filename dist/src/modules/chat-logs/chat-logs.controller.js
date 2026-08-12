"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatLogsController = void 0;
const chat_logs_service_js_1 = require("./chat-logs.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class ChatLogsController {
    static async list(req, res) {
        const list = await chat_logs_service_js_1.ChatLogsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async getById(req, res) {
        const log = await chat_logs_service_js_1.ChatLogsService.getById(req.params.id);
        if (!log) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Chat log not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, log);
    }
    static async getByMember(req, res) {
        const logs = await chat_logs_service_js_1.ChatLogsService.getByMember(req.params.memberId);
        return api_response_js_1.ApiResponse.success(res, logs);
    }
}
exports.ChatLogsController = ChatLogsController;
