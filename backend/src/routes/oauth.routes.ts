import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { AsyncRequestHandler } from '../types/express.js';

const router = Router();

// Rutas públicas para OAuth (no requieren autenticación)
router.get('/google-drive/start', oauthController.startGoogleDriveAuth as unknown as AsyncRequestHandler);
router.get('/google/callback', oauthController.handleGoogleCallback as unknown as AsyncRequestHandler);

// Rutas protegidas (requieren autenticación de admin)
router.get('/status', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  oauthController.getTokenStatus as unknown as AsyncRequestHandler
] as any[]);

router.post('/verify/:provider', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  oauthController.verifyToken as unknown as AsyncRequestHandler
] as any[]);

export const oauthRouter = router;
export default router;
