"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsController = void 0;
const audit_logs_service_js_1 = require("./audit-logs.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class AuditLogsController {
    static async list(req, res) {
        const list = await audit_logs_service_js_1.AuditLogsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
}
exports.AuditLogsController = AuditLogsController;
