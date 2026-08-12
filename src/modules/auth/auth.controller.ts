import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    if (!result) {
      return ApiResponse.error(
        res,
        { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        401
      );
    }

    return ApiResponse.success(res, result);
  }

  static async logout(req: Request, res: Response) {
    return ApiResponse.noContent(res);
  }

  static async me(req: Request, res: Response) {
    if (!req.user?.sub) {
      return ApiResponse.error(
        res,
        { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        401
      );
    }

    const user = await AuthService.me(req.user.sub);
    if (!user) {
      return ApiResponse.error(
        res,
        { code: 'NOT_FOUND', message: 'User not found' },
        404
      );
    }

    return ApiResponse.success(res, user);
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    return ApiResponse.noContent(res);
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    const success = await AuthService.resetPassword(token, password);
    if (!success) {
      return ApiResponse.error(
        res,
        { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired' },
        400
      );
    }
    return ApiResponse.noContent(res);
  }
}
