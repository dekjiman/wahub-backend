import { Request, Response } from 'express';
import { IntegrationsService } from './integrations.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class IntegrationsController {
  static async list(req: Request, res: Response) {
    const list = await IntegrationsService.list();
    return ApiResponse.success(res, list);
  }

  static async refresh(req: Request, res: Response) {
    const integration = await IntegrationsService.refresh(req.params.id);
    if (!integration) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Integration not found' },
        404
      );
    }
    return ApiResponse.success(res, integration);
  }
}
