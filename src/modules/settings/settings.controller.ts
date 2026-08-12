import { Request, Response } from 'express';
import { SettingsService } from './settings.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class SettingsController {
  static async list(req: Request, res: Response) {
    const list = await SettingsService.list();
    return ApiResponse.success(res, list);
  }

  static async update(req: Request, res: Response) {
    const adminId = req.user?.sub;
    const setting = await SettingsService.update(
      req.params.key,
      req.body.value,
      adminId
    );
    return ApiResponse.success(res, setting);
  }
}
