import { Router } from 'express';
import { driveController } from '../controllers/drive.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas protegidas (admin)
router.post('/upload', [
    authMiddleware,
    isAdmin,
    driveController.uploadMiddleware,
    driveController.uploadFile
]);
// Ruta para subir imágenes temporales (solo requiere autenticación)
router.post('/upload/temp', [
    authMiddleware,
    driveController.uploadMultipleMiddleware,
    driveController.uploadFile
]);
router.post('/upload/service', [
    authMiddleware,
    isAdmin,
    driveController.uploadMultipleMiddleware,
    driveController.uploadServiceImages
]);
router.get('/files', [
    authMiddleware,
    isAdmin,
    driveController.listFiles
]);
router.delete('/files/:fileId', [
    authMiddleware,
    isAdmin,
    driveController.deleteFile
]);
router.get('/files/:fileId/share', [
    authMiddleware,
    isAdmin,
    driveController.getPublicUrl
]);
export const driveRouter = router;
export default router;
