import { Request, Response } from 'express';
import { WorkflowsService } from './workflows.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class WorkflowsController {
  static async list(req: Request, res: Response) {
    const list = await WorkflowsService.list();
    return ApiResponse.success(res, list);
  }

  static async retry(req: Request, res: Response) {
    const run = await WorkflowsService.retry(req.params.id);
    if (!run) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Workflow run not found' },
        404
      );
    }
    return ApiResponse.success(res, run);
  }
}
