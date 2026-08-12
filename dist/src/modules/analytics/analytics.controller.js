"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_js_1 = require("./analytics.service.js");
const api_response_js_1 = require("../../utils/api-response.js");
class AnalyticsController {
    static async overview(req, res) {
        const [member_growth, sentiment, topics, spam_per_group, delivery_rate] = await Promise.all([
            analytics_service_js_1.AnalyticsService.getGrowth(),
            analytics_service_js_1.AnalyticsService.getSentiment(),
            analytics_service_js_1.AnalyticsService.getTopics(),
            analytics_service_js_1.AnalyticsService.getSpam(),
            analytics_service_js_1.AnalyticsService.getDelivery(),
        ]);
        return api_response_js_1.ApiResponse.success(res, {
            member_growth,
            messages_per_group: member_growth,
            sentiment,
            topics,
            spam_per_group,
            tickets_by_status: [],
            tickets_by_priority: [],
            resolution_hours: [],
            delivery_rate,
            ai_confidence: [],
            admin_performance: [],
        });
    }
    static async growth(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getGrowth();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async sentiment(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getSentiment();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async topics(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getTopics();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async spam(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getSpam();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async delivery(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getDelivery();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async messageActivity(req, res) {
        const period = req.query.period || '30d';
        const data = await analytics_service_js_1.AnalyticsService.getMessageActivity(period);
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async heatmaps(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getHeatmaps();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async moderationSummary(req, res) {
        const data = await analytics_service_js_1.AnalyticsService.getModerationSummary();
        return api_response_js_1.ApiResponse.success(res, data);
    }
    static async exportMembers(req, res) {
        const csv = await analytics_service_js_1.AnalyticsService.exportMembersCsv();
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="members-export-${dateStr}.csv"`);
        return res.status(200).send(csv);
    }
    static async exportMessages(req, res) {
        const csv = await analytics_service_js_1.AnalyticsService.exportMessagesCsv();
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="messages-export-${dateStr}.csv"`);
        return res.status(200).send(csv);
    }
    static async exportModeration(req, res) {
        const csv = await analytics_service_js_1.AnalyticsService.exportModerationCsv();
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="moderation-export-${dateStr}.csv"`);
        return res.status(200).send(csv);
    }
}
exports.AnalyticsController = AnalyticsController;
