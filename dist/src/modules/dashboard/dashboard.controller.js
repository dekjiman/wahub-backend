"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_js_1 = require("./dashboard.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class DashboardController {
    static async summary(req, res) {
        const summaryData = await dashboard_service_js_1.DashboardService.getSummary();
        return api_response_js_1.ApiResponse.success(res, summaryData);
    }
    static async health(req, res) {
        const healthData = await dashboard_service_js_1.DashboardService.getHealth();
        return api_response_js_1.ApiResponse.success(res, healthData);
    }
    static async recentActivities(req, res) {
        const activities = await dashboard_service_js_1.DashboardService.getRecentActivities();
        return api_response_js_1.ApiResponse.success(res, activities);
    }
}
exports.DashboardController = DashboardController;
