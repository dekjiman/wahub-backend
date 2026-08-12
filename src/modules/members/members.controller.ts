import { Request, Response } from 'express';
import { MembersService } from './members.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class MembersController {
  static async list(req: Request, res: Response) {
    const membersList = await MembersService.list();
    return ApiResponse.success(res, membersList);
  }

  static async create(req: Request, res: Response) {
    try {
      const member = await MembersService.create(req.body);
      return ApiResponse.success(res, member, 201);
    } catch (error: any) {
      if (error?.code === '23505') {
        return ApiResponse.error(
          res,
          {
            code: 'MEMBER_EXISTS',
            message: 'WhatsApp number already registered',
            field: 'whatsapp_number',
          },
          409
        );
      }
      throw error;
    }
  }

  static async update(req: Request, res: Response) {
    const member = await MembersService.update(req.params.id, req.body);
    if (!member) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Member not found' },
        404
      );
    }
    return ApiResponse.success(res, member);
  }

  static async getGroups(req: Request, res: Response) {
    const groupsList = await MembersService.getGroups(req.params.id);
    return ApiResponse.success(res, groupsList);
  }

  static async getWarnings(req: Request, res: Response) {
    const warnings = await MembersService.getWarnings(req.params.id);
    return ApiResponse.success(res, warnings);
  }

  static async issueWarning(req: Request, res: Response) {
    const adminId = req.user?.sub || 'system';
    const warning = await MembersService.issueWarning(
      req.params.id,
      adminId,
      req.body
    );
    return ApiResponse.success(res, warning, 201);
  }

  static async getMessages(req: Request, res: Response) {
    const messages = await MembersService.getMessages(req.params.id);
    return ApiResponse.success(res, messages);
  }
}
