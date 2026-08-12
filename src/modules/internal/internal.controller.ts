import { Request, Response } from 'express';
import { InternalService } from './internal.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class InternalController {
  static async getEvent(req: Request, res: Response) {
    const event = await InternalService.getEventById(req.params.id);
    if (!event) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Event not found' },
        404
      );
    }
    return ApiResponse.success(res, event);
  }

  static async createAiAnalysis(req: Request, res: Response) {
    try {
      const result = await InternalService.createAiAnalysis(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create AI analysis' },
        400
      );
    }
  }

  static async createModerationAlert(req: Request, res: Response) {
    try {
      const result = await InternalService.createModerationAlert(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create moderation alert' },
        400
      );
    }
  }

  static async createEscalation(req: Request, res: Response) {
    try {
      const result = await InternalService.createEscalation(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create escalation' },
        400
      );
    }
  }

  static async createWorkflowRun(req: Request, res: Response) {
    try {
      const result = await InternalService.createWorkflowRun(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to record workflow run' },
        400
      );
    }
  }
}
