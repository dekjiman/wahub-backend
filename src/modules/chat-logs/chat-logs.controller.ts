import { Request, Response } from 'express';
import { ChatLogsService } from './chat-logs.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class ChatLogsController {
  static async list(req: Request, res: Response) {
    const list = await ChatLogsService.list();
    return ApiResponse.success(res, list);
  }

  static async getById(req: Request, res: Response) {
    const log = await ChatLogsService.getById(req.params.id);
    if (!log) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Chat log not found' },
        404
      );
    }
    return ApiResponse.success(res, log);
  }

  static async getByMember(req: Request, res: Response) {
    const logs = await ChatLogsService.getByMember(req.params.memberId);
    return ApiResponse.success(res, logs);
  }
}
