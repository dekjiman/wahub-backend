import { Request, Response } from 'express';
import { GroupsService } from './groups.service.js';
import { ApiResponse } from '../../utils/api-response.js';
import { env } from '../../config/env.js';

export class GroupsController {
  static async list(req: Request, res: Response) {
    const list = await GroupsService.list();
    return ApiResponse.success(res, list);
  }

  static async getById(req: Request, res: Response) {
    const group = await GroupsService.getById(req.params.id);
    if (!group) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
    }
    return ApiResponse.success(res, group);
  }

  static async create(req: Request, res: Response) {
    try {
      const group = await GroupsService.create(req.body);
      return ApiResponse.success(res, group, 201);
    } catch (error: any) {
      if (error?.code === '23505') {
        return ApiResponse.error(
          res,
          {
            code: 'GROUP_EXISTS',
            message: 'WhatsApp Group JID already exists',
            field: 'whatsapp_group_jid',
          },
          409
        );
      }
      return ApiResponse.error(
        res,
        {
          code: 'CREATE_FAILED',
          message: error.message || 'Failed to create group',
        },
        400
      );
    }
  }

  static async update(req: Request, res: Response) {
    const group = await GroupsService.update(req.params.id, req.body);
    if (!group) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Group not found' },
        404
      );
    }
    return ApiResponse.success(res, group);
  }

  static async delete(req: Request, res: Response) {
    const success = await GroupsService.delete(req.params.id);
    if (!success) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
    }
    return ApiResponse.noContent(res);
  }

  static async getMembers(req: Request, res: Response) {
    const membersList = await GroupsService.getMembers(req.params.id);
    return ApiResponse.success(res, membersList);
  }

  static async syncMembers(req: Request, res: Response) {
    try {
      const result = await GroupsService.syncParticipants(
        req.params.id,
        req.body.instance_name || env.EVOLUTION_DEFAULT_INSTANCE
      );
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'SYNC_FAILED',
        message: error.message || 'Failed to sync members from WhatsApp',
      }, 400);
    }
  }

  static async getMetrics(req: Request, res: Response) {
    const metrics = await GroupsService.getMetrics(req.params.id);
    if (!metrics) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Group not found' },
        404
      );
    }
    return ApiResponse.success(res, metrics);
  }

  static async pauseAi(req: Request, res: Response) {
    const { minutes } = req.body;
    const group = await GroupsService.pauseAi(req.params.id, minutes || 60);
    if (!group) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Group not found' },
        404
      );
    }
    return ApiResponse.success(res, group);
  }

  static async resumeAi(req: Request, res: Response) {
    const group = await GroupsService.resumeAi(req.params.id);
    if (!group) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Group not found' },
        404
      );
    }
    return ApiResponse.success(res, group);
  }

  static async syncFromWhatsApp(req: Request, res: Response) {
    try {
      const result = await GroupsService.syncFromWhatsApp(
        req.body.instance_name || env.EVOLUTION_DEFAULT_INSTANCE
      );
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'SYNC_FAILED',
        message: error.message || 'Failed to sync groups from WhatsApp',
      }, 400);
    }
  }

  static async getMessages(req: Request, res: Response) {
    const groupId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const direction = (req.query.direction as string) || undefined;
    const type = (req.query.type as string) || undefined;

    const group = await GroupsService.getById(groupId);
    if (!group) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Group not found' },
        404
      );
    }

    const result = await GroupsService.getGroupMessages(groupId, {
      page,
      limit,
      direction,
      type,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  static async sendMessage(req: Request, res: Response) {
    try {
      const groupId = req.params.id;
      const adminId = (req.user as any)?.adminId || (req.user as any)?.id;

      const result = await GroupsService.sendGroupMessage(
        groupId,
        req.body,
        adminId
      );

      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      const statusCode = error.message === 'Group not found' ? 404 : 400;
      return ApiResponse.error(
        res,
        {
          code: 'SEND_FAILED',
          message: error.message || 'Failed to send message',
        },
        statusCode
      );
    }
  }
}


