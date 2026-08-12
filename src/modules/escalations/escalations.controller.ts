import { Request, Response } from 'express';
import { EscalationsService } from './escalations.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class EscalationsController {
  static async list(req: Request, res: Response) {
    const list = await EscalationsService.list();
    return ApiResponse.success(res, list);
  }

  static async getById(req: Request, res: Response) {
    const escalation = await EscalationsService.getById(req.params.id);
    if (!escalation) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Escalation not found' },
        404
      );
    }
    return ApiResponse.success(res, escalation);
  }

  static async getComments(req: Request, res: Response) {
    const comments = await EscalationsService.getComments(req.params.id);
    return ApiResponse.success(res, comments);
  }

  static async assign(req: Request, res: Response) {
    const escalation = await EscalationsService.assign(
      req.params.id,
      req.body.admin_id
    );
    if (!escalation) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Escalation not found' },
        404
      );
    }
    return ApiResponse.success(res, escalation);
  }

  static async updateStatus(req: Request, res: Response) {
    const escalation = await EscalationsService.updateStatus(
      req.params.id,
      req.body.status
    );
    if (!escalation) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Escalation not found' },
        404
      );
    }
    return ApiResponse.success(res, escalation);
  }

  static async addComment(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const comment = await EscalationsService.addComment(
      req.params.id,
      adminId,
      req.body.content,
      req.body.is_internal
    );
    return ApiResponse.success(res, comment, 201);
  }

  static async create(req: Request, res: Response) {
    const result = await EscalationsService.create(req.body);
    return ApiResponse.success(res, result, 201);
  }

  static async resolve(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const result = await EscalationsService.resolve(
      req.params.id,
      adminId,
      req.body?.notes
    );
    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Escalation not found' },
        404
      );
    }
    return ApiResponse.success(res, result);
  }
}

