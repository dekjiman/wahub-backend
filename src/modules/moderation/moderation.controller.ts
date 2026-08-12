import { Request, Response } from 'express';
import { ModerationService } from './moderation.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class ModerationController {
  static async list(req: Request, res: Response) {
    const list = await ModerationService.list();
    return ApiResponse.success(res, list);
  }

  static async getById(req: Request, res: Response) {
    const alert = await ModerationService.getById(req.params.id);
    if (!alert) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Moderation alert not found' },
        404
      );
    }
    return ApiResponse.success(res, alert);
  }

  static async approve(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const alert = await ModerationService.approve(req.params.id, adminId);
    if (!alert) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Moderation alert not found' },
        404
      );
    }
    return ApiResponse.success(res, alert);
  }

  static async reject(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const alert = await ModerationService.reject(req.params.id, adminId);
    if (!alert) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Moderation alert not found' },
        404
      );
    }
    return ApiResponse.success(res, alert);
  }

  static async execute(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const alert = await ModerationService.execute(
      req.params.id,
      adminId,
      req.body?.action_taken
    );
    if (!alert) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Moderation alert not found' },
        404
      );
    }
    return ApiResponse.success(res, alert);
  }
}
