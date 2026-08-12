import { Request, Response } from 'express';
import { AuditLogsService } from './audit-logs.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class AuditLogsController {
  static async list(req: Request, res: Response) {
    const list = await AuditLogsService.list();
    return ApiResponse.success(res, list);
  }
}
