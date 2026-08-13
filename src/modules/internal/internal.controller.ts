import { Request, Response } from 'express';
import { InternalService } from './internal.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class InternalController {
  static async getEvent(req: Request, res: Response) {
    const event = await InternalService.getEventById(req.params.id);
    if (!event) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'Event not found' },
        404
      );
    }
    return ApiResponse.success(res, event);
  }

  static async listAdmins(req: Request, res: Response) {
    try {
      const result = await InternalService.listAdmins();
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, { code: 'LIST_FAILED', message: error.message }, 500);
    }
  }

  static async listAdminsByRole(req: Request, res: Response) {
    try {
      const result = await InternalService.listAdmins(req.params.role);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, { code: 'LIST_FAILED', message: error.message }, 500);
    }
  }

  static async lookupMemberByPhone(req: Request, res: Response) {
    try {
      const result = await InternalService.lookupMemberByPhone(req.params.phone);
      if (!result) return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Member not found' }, 404);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, { code: 'LOOKUP_FAILED', message: error.message }, 500);
    }
  }

  static async lookupGroupByJid(req: Request, res: Response) {
    try {
      const result = await InternalService.lookupGroupByJid(req.params.jid);
      if (!result) return ApiResponse.error(res, { code: 'NOT_FOUND', message: 'Group not found' }, 404);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      return ApiResponse.error(res, { code: 'LOOKUP_FAILED', message: error.message }, 500);
    }
  }

  static async createAiAnalysis(req: Request, res: Response) {
    try {
      const result = await InternalService.createAiAnalysis(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create AI analysis' },
        400
      );
    }
  }

  static async createModerationAlert(req: Request, res: Response) {
    try {
      const result = await InternalService.createModerationAlert(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create moderation alert' },
        400
      );
    }
  }

  static async createMemberWarning(req: Request, res: Response) {
    try {
      const result = await InternalService.createMemberWarning(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create member warning' },
        400
      );
    }
  }

  static async createEscalation(req: Request, res: Response) {
    try {
      const result = await InternalService.createEscalation(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to create escalation' },
        400
      );
    }
  }

  static async createWorkflowRun(req: Request, res: Response) {
    try {
      const result = await InternalService.createWorkflowRun(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        { code: 'CREATE_FAILED', message: error.message || 'Failed to record workflow run' },
        400
      );
    }
  }
}
