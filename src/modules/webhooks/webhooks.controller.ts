import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class WebhooksController {
  static async receiveEvolutionGo(req: Request, res: Response) {
    const result = await WebhooksService.ingest(req.body);

    if (!result.stored) {
      return ApiResponse.success(res, {
        received: true,
        duplicate: Boolean(result.duplicate),
      });
    }

    WebhooksService.scheduleProcessing(result.eventId!);
    return ApiResponse.success(res, {
      received: true,
      duplicate: false,
      eventId: result.eventId,
    });
  }
}
