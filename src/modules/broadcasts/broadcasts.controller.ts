import { Request, Response } from 'express';
import { BroadcastsService } from './broadcasts.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class BroadcastsController {
  static async list(req: Request, res: Response) {
    const list = await BroadcastsService.list();
    return ApiResponse.success(res, list);
  }

  static async getById(req: Request, res: Response) {
    const broadcast = await BroadcastsService.getById(req.params.id);
    if (!broadcast) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Broadcast not found' },
        404
      );
    }
    return ApiResponse.success(res, broadcast);
  }

  static async getRecipients(req: Request, res: Response) {
    const recipients = await BroadcastsService.getRecipients(req.params.id);
    return ApiResponse.success(res, recipients);
  }

  static async create(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const broadcast = await BroadcastsService.create(adminId, req.body);
    return ApiResponse.success(res, broadcast, 201);
  }

  static async updateStatus(req: Request, res: Response) {
    const broadcast = await BroadcastsService.updateStatus(
      req.params.id,
      req.body.status
    );
    if (!broadcast) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Broadcast not found' },
        404
      );
    }
    return ApiResponse.success(res, broadcast);
  }

  static async approve(req: Request, res: Response) {
    const broadcast = await BroadcastsService.approve(req.params.id);
    if (!broadcast) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Broadcast not found' },
        404
      );
    }
    return ApiResponse.success(res, broadcast);
  }

  static async send(req: Request, res: Response) {
    const broadcast = await BroadcastsService.send(req.params.id);
    if (!broadcast) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Broadcast not found or cannot be sent' },
        400
      );
    }
    return ApiResponse.success(res, broadcast);
  }
}

