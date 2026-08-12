import { Request, Response } from 'express';
import { EvolutionService } from '../../services/evolution.service.js';
import { ApiResponse } from '../../utils/api-response.js';
import { env } from '../../config/env.js';

export class WhatsappController {
  static async listInstances(req: Request, res: Response) {
    const instances = await EvolutionService.fetchInstances();
    return ApiResponse.success(res, instances || []);
  }

  static async listCommunities(req: Request, res: Response) {
    const instanceName = req.query.instance_name as string;
    if (!instanceName) {
      return ApiResponse.error(
        res,
        { code: 'VALIDATION_ERROR', message: 'instance_name is required' },
        400
      );
    }
    const communities = await EvolutionService.fetchCommunities(instanceName);
    return ApiResponse.success(res, communities || []);
  }

  static async listGroups(req: Request, res: Response) {
    const instanceName = req.query.instance_name as string;
    if (!instanceName) {
      return ApiResponse.error(
        res,
        { code: 'VALIDATION_ERROR', message: 'instance_name is required' },
        400
      );
    }
    const groups = await EvolutionService.fetchGroups(instanceName);
    return ApiResponse.success(res, groups || []);
  }

  static async getStatus(req: Request, res: Response) {
    const instanceName = req.query.instance_name as string;
    if (!instanceName) {
      return ApiResponse.error(
        res,
        { code: 'VALIDATION_ERROR', message: 'instance_name is required' },
        400
      );
    }
    const status = await EvolutionService.getConnectionState(instanceName);
    if (!status) {
      return ApiResponse.error(
        res,
        { code: 'INSTANCE_NOT_FOUND', message: `Instance "${instanceName}" not found` },
        404
      );
    }
    return ApiResponse.success(res, status);
  }

  static async getQr(req: Request, res: Response) {
    const instanceName = req.query.instance_name as string;
    if (!instanceName) {
      return ApiResponse.error(
        res,
        { code: 'VALIDATION_ERROR', message: 'instance_name is required' },
        400
      );
    }
    const qr = await EvolutionService.getQr(instanceName);
    if (!qr) {
      return ApiResponse.error(
        res,
        { code: 'QR_UNAVAILABLE', message: 'QR code unavailable. Make sure the instance is disconnected first.' },
        409
      );
    }
    return ApiResponse.success(res, qr);
  }

  static async connect(req: Request, res: Response) {
    const { instance_name, webhook_url } = req.body;
    const result = await EvolutionService.connect(
      instance_name,
      webhook_url || env.EVOLUTION_WEBHOOK_URL
    );
    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'CONNECT_FAILED', message: `Failed to connect instance "${instance_name}"` },
        400
      );
    }
    return ApiResponse.success(res, result);
  }

  static async pair(req: Request, res: Response) {
    const { instance_name, phone } = req.body;
    const result = await EvolutionService.pair(instance_name, phone);
    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'PAIR_FAILED', message: `Failed to pair instance "${instance_name}"` },
        400
      );
    }
    return ApiResponse.success(res, result);
  }

  static async disconnect(req: Request, res: Response) {
    const { instance_name } = req.body;
    const result = await EvolutionService.disconnect(instance_name);
    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'DISCONNECT_FAILED', message: `Failed to disconnect instance "${instance_name}"` },
        400
      );
    }
    return ApiResponse.success(res, result);
  }

  static async logout(req: Request, res: Response) {
    const { instance_name } = req.body;
    const result = await EvolutionService.logout(instance_name);
    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'LOGOUT_FAILED', message: `Failed to logout instance "${instance_name}"` },
        400
      );
    }
    return ApiResponse.success(res, result);
  }

  static async delete(req: Request, res: Response) {
    const result = await EvolutionService.deleteInstance(req.params.instanceName);
    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'DELETE_FAILED', message: `Failed to delete instance "${req.params.instanceName}"` },
        400
      );
    }
    return ApiResponse.success(res, result);
  }

  static async reconcile(req: Request, res: Response) {
    const instanceName = (req.body.instance_name as string) || env.EVOLUTION_DEFAULT_INSTANCE;
    const { ReconciliationService } = await import('../../services/reconciliation.service.js');
    const result = await ReconciliationService.runReconciliation(instanceName);
    return ApiResponse.success(res, result);
  }
}

