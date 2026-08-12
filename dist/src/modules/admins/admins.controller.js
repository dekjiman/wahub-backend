"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminsController = void 0;
const admins_service_js_1 = require("./admins.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class AdminsController {
    static async list(req, res) {
        const list = await admins_service_js_1.AdminsService.list();
        return api_response_js_1.ApiResponse.success(res, list);
    }
    static async create(req, res) {
        try {
            const admin = await admins_service_js_1.AdminsService.create(req.body);
            return api_response_js_1.ApiResponse.success(res, admin, 201);
        }
        catch (error) {
            if (error?.code === '23505') {
                return api_response_js_1.ApiResponse.error(res, { code: 'EMAIL_EXISTS', message: 'Email address already in use', field: 'email' }, 409);
            }
            throw error;
        }
    }
    static async update(req, res) {
        const admin = await admins_service_js_1.AdminsService.update(req.params.id, req.body);
        if (!admin) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Admin not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, admin);
    }
    static async delete(req, res) {
        const success = await admins_service_js_1.AdminsService.delete(req.params.id);
        if (!success) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Admin not found' }, 404);
        }
        return api_response_js_1.ApiResponse.noContent(res);
    }
}
exports.AdminsController = AdminsController;
