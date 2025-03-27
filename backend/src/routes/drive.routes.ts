import { Router } from 'express';
import { driveController } from '../controllers/drive.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { AsyncRequestHandler } from '../types/express.js';

const router = Router();

// Rutas protegidas (admin)
router.post('/upload', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  driveController.uploadMiddleware,
  driveController.uploadFile as unknown as AsyncRequestHandler
] as any[]);

// Ruta para subir imágenes temporales (solo requiere autenticación)
router.post('/upload/temp', [
  authMiddleware as unknown as AsyncRequestHandler,
  driveController.uploadMultipleMiddleware,
  driveController.uploadFile as unknown as AsyncRequestHandler
] as any[]);

router.post('/upload/service', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  driveController.uploadMultipleMiddleware,
  driveController.uploadServiceImages as unknown as AsyncRequestHandler
] as any[]);

router.get('/files', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  driveController.listFiles as unknown as AsyncRequestHandler
] as any[]);

router.delete('/files/:fileId', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  driveController.deleteFile as unknown as AsyncRequestHandler
] as any[]);

router.get('/files/:fileId/share', [
  authMiddleware as unknown as AsyncRequestHandler,
  isAdmin as unknown as AsyncRequestHandler,
  driveController.getPublicUrl as unknown as AsyncRequestHandler
] as any[]);

export const driveRouter = router;
export default router; 