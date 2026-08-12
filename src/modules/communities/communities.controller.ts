import { Request, Response } from 'express';
import { CommunitiesService } from './communities.service.js';
import { ApiResponse } from '../../utils/api-response.js';
import { env } from '../../config/env.js';

export class CommunitiesController {
  static async list(req: Request, res: Response) {
    const list = await CommunitiesService.list();
    return ApiResponse.success(res, list);
  }

  static async getById(req: Request, res: Response) {
    const community = await CommunitiesService.getById(req.params.id);
    if (!community) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Community not found' }, 404);
    }
    return ApiResponse.success(res, community);
  }

  static async create(req: Request, res: Response) {
    try {
      const community = await CommunitiesService.create(req.body);
      return ApiResponse.success(res, community, 201);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'CREATE_FAILED',
        message: error.message || 'Failed to create community',
      }, 400);
    }
  }

  static async update(req: Request, res: Response) {
    const community = await CommunitiesService.update(req.params.id, req.body);
    if (!community) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Community not found' }, 404);
    }
    return ApiResponse.success(res, community);
  }

  static async delete(req: Request, res: Response) {
    const success = await CommunitiesService.delete(req.params.id);
    if (!success) {
      return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Community not found' }, 404);
    }
    return ApiResponse.noContent(res);
  }

  static async getGroups(req: Request, res: Response) {
    const groupsList = await CommunitiesService.getGroups(req.params.id);
    return ApiResponse.success(res, groupsList);
  }

  static async syncToWhatsApp(req: Request, res: Response) {
    try {
      const result = await CommunitiesService.syncToWhatsApp(
        req.params.id,
        req.body.instance_name,
        req.body.description,
        req.body.group_jids
      );
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'SYNC_FAILED',
        message: error.message,
      }, 400);
    }
  }

  static async addGroupsToWhatsApp(req: Request, res: Response) {
    try {
      const result = await CommunitiesService.addGroupsToWhatsApp(
        req.params.id,
        req.body.instance_name,
        req.body.group_jids
      );
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'SYNC_FAILED',
        message: error.message,
      }, 400);
    }
  }

  static async removeGroupsFromWhatsApp(req: Request, res: Response) {
    try {
      const result = await CommunitiesService.removeGroupsFromWhatsApp(
        req.params.id,
        req.body.instance_name,
        req.body.group_jids
      );
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'SYNC_FAILED',
        message: error.message,
      }, 400);
    }
  }

  static async fetchFromWhatsApp(req: Request, res: Response) {
    const communitiesList = await CommunitiesService.fetchFromWhatsApp(
      req.query.instance_name as string
    );
    return ApiResponse.success(res, communitiesList);
  }

  static async syncFromWhatsApp(req: Request, res: Response) {
    try {
      const result = await CommunitiesService.syncFromWhatsApp(
        req.body.instance_name || env.EVOLUTION_DEFAULT_INSTANCE
      );
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, {
        code: 'SYNC_FAILED',
        message: error.message || 'Failed to sync communities from WhatsApp',
      }, 400);
    }
  }

  static async getWhatsAppInfo(req: Request, res: Response) {
    const info = await CommunitiesService.getWhatsAppInfo(
      req.query.instance_name as string,
      req.params.communityJid
    );
    if (!info) {
      return ApiResponse.error(res, {
        code: 'NOT_FOUND',
        message: 'Community not found on WhatsApp',
      }, 404);
    }
    return ApiResponse.success(res, info);
  }
}
