"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_js_1 = require("./auth.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        const result = await auth_service_js_1.AuthService.login(email, password);
        if (!result) {
            return api_response_js_1.ApiResponse.error(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, 401);
        }
        return api_response_js_1.ApiResponse.success(res, result);
    }
    static async logout(req, res) {
        return api_response_js_1.ApiResponse.noContent(res);
    }
    static async me(req, res) {
        if (!req.user?.sub) {
            return api_response_js_1.ApiResponse.error(res, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        }
        const user = await auth_service_js_1.AuthService.me(req.user.sub);
        if (!user) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, user);
    }
    static async forgotPassword(req, res) {
        const { email } = req.body;
        await auth_service_js_1.AuthService.forgotPassword(email);
        return api_response_js_1.ApiResponse.noContent(res);
    }
    static async resetPassword(req, res) {
        const { token, password } = req.body;
        const success = await auth_service_js_1.AuthService.resetPassword(token, password);
        if (!success) {
            return api_response_js_1.ApiResponse.error(res, { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired' }, 400);
        }
        return api_response_js_1.ApiResponse.noContent(res);
    }
}
exports.AuthController = AuthController;
