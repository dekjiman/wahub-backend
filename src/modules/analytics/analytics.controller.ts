import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class AnalyticsController {
  static async overview(req: Request, res: Response) {
    const [member_growth, sentiment, topics, spam_per_group, delivery_rate] = await Promise.all([
      AnalyticsService.getGrowth(),
      AnalyticsService.getSentiment(),
      AnalyticsService.getTopics(),
      AnalyticsService.getSpam(),
      AnalyticsService.getDelivery(),
    ]);
    return ApiResponse.success(res, {
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

  static async growth(req: Request, res: Response) {
    const data = await AnalyticsService.getGrowth();
    return ApiResponse.success(res, data);
  }

  static async sentiment(req: Request, res: Response) {
    const data = await AnalyticsService.getSentiment();
    return ApiResponse.success(res, data);
  }

  static async topics(req: Request, res: Response) {
    const data = await AnalyticsService.getTopics();
    return ApiResponse.success(res, data);
  }

  static async spam(req: Request, res: Response) {
    const data = await AnalyticsService.getSpam();
    return ApiResponse.success(res, data);
  }

  static async delivery(req: Request, res: Response) {
    const data = await AnalyticsService.getDelivery();
    return ApiResponse.success(res, data);
  }

  static async messageActivity(req: Request, res: Response) {
    const period = (req.query.period as string) || '30d';
    const data = await AnalyticsService.getMessageActivity(period);
    return ApiResponse.success(res, data);
  }

  static async heatmaps(req: Request, res: Response) {
    const data = await AnalyticsService.getHeatmaps();
    return ApiResponse.success(res, data);
  }

  static async moderationSummary(req: Request, res: Response) {
    const data = await AnalyticsService.getModerationSummary();
    return ApiResponse.success(res, data);
  }

  static async exportMembers(req: Request, res: Response) {
    const csv = await AnalyticsService.exportMembersCsv();
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="members-export-${dateStr}.csv"`);
    return res.status(200).send(csv);
  }

  static async exportMessages(req: Request, res: Response) {
    const csv = await AnalyticsService.exportMessagesCsv();
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="messages-export-${dateStr}.csv"`);
    return res.status(200).send(csv);
  }

  static async exportModeration(req: Request, res: Response) {
    const csv = await AnalyticsService.exportModerationCsv();
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="moderation-export-${dateStr}.csv"`);
    return res.status(200).send(csv);
  }
}

