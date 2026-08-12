import { Request, Response } from 'express';
import { AdminsService } from './admins.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class AdminsController {
  static async list(req: Request, res: Response) {
    const list = await AdminsService.list();
    return ApiResponse.success(res, list);
  }

  static async create(req: Request, res: Response) {
    try {
      const admin = await AdminsService.create(req.body);
      return ApiResponse.success(res, admin, 201);
    } catch (error: any) {
      if (error?.code === '23505') {
        return ApiResponse.error(
          res,
          { code: 'EMAIL_EXISTS', message: 'Email address already in use', field: 'email' },
          409
        );
      }
      throw error;
    }
  }

  static async update(req: Request, res: Response) {
    const admin = await AdminsService.update(req.params.id, req.body);
    if (!admin) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Admin not found' }, 404);
    }
    return ApiResponse.success(res, admin);
  }

  static async delete(req: Request, res: Response) {
    const success = await AdminsService.delete(req.params.id);
    if (!success) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Admin not found' }, 404);
    }
    return ApiResponse.noContent(res);
  }
}
