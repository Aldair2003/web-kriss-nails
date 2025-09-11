import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas públicas para OAuth (no requieren autenticación)
router.get('/google-drive/start', oauthController.startGoogleDriveAuth);
router.get('/google/callback', oauthController.handleGoogleCallback);
// Rutas protegidas (requieren autenticación de admin)
router.get('/status', [
    authMiddleware,
    isAdmin,
    oauthController.getTokenStatus
]);
router.post('/verify/:provider', [
    authMiddleware,
    isAdmin,
    oauthController.verifyToken
]);
export const oauthRouter = router;
export default router;
