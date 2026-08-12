"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersController = void 0;
const members_service_js_1 = require("./members.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class MembersController {
    static async list(req, res) {
        const membersList = await members_service_js_1.MembersService.list();
        return api_response_js_1.ApiResponse.success(res, membersList);
    }
    static async create(req, res) {
        try {
            const member = await members_service_js_1.MembersService.create(req.body);
            return api_response_js_1.ApiResponse.success(res, member, 201);
        }
        catch (error) {
            if (error?.code === '23505') {
                return api_response_js_1.ApiResponse.error(res, {
                    code: 'MEMBER_EXISTS',
                    message: 'WhatsApp number already registered',
                    field: 'whatsapp_number',
                }, 409);
            }
            throw error;
        }
    }
    static async update(req, res) {
        const member = await members_service_js_1.MembersService.update(req.params.id, req.body);
        if (!member) {
            return api_response_js_1.ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Member not found' }, 404);
        }
        return api_response_js_1.ApiResponse.success(res, member);
    }
    static async getGroups(req, res) {
        const groupsList = await members_service_js_1.MembersService.getGroups(req.params.id);
        return api_response_js_1.ApiResponse.success(res, groupsList);
    }
    static async getWarnings(req, res) {
        const warnings = await members_service_js_1.MembersService.getWarnings(req.params.id);
        return api_response_js_1.ApiResponse.success(res, warnings);
    }
    static async issueWarning(req, res) {
        const adminId = req.user?.sub || 'system';
        const warning = await members_service_js_1.MembersService.issueWarning(req.params.id, adminId, req.body);
        return api_response_js_1.ApiResponse.success(res, warning, 201);
    }
    static async getMessages(req, res) {
        const messages = await members_service_js_1.MembersService.getMessages(req.params.id);
        return api_response_js_1.ApiResponse.success(res, messages);
    }
}
exports.MembersController = MembersController;
