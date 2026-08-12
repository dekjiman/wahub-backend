import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class DashboardController {
  static async summary(req: Request, res: Response) {
    const summaryData = await DashboardService.getSummary();
    return ApiResponse.success(res, summaryData);
  }

  static async health(req: Request, res: Response) {
    const healthData = await DashboardService.getHealth();
    return ApiResponse.success(res, healthData);
  }

  static async recentActivities(req: Request, res: Response) {
    const activities = await DashboardService.getRecentActivities();
    return ApiResponse.success(res, activities);
  }
}
