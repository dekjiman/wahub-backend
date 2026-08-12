"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settings_service_js_1 = require("./settings.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class SettingsController {
    static async list(req, res) {
        const list = await settings_service_js_1.SettingsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async update(req, res) {
        const adminId = req.user?.sub;
        const setting = await settings_service_js_1.SettingsService.update(req.params.key, req.body.value, adminId);
        return api_response_js_1.ApiResponse.success(res, setting);
    }
}
exports.SettingsController = SettingsController;
