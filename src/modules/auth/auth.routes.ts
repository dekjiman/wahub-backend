import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';

import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  AuthController.login
);

router.post('/logout', AuthController.logout);
router.get('/me', authenticateJwt, AuthController.me);
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;
