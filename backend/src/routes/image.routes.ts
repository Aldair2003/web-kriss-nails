import { Router } from 'express';
import { imageController } from '../controllers/image.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { uploadMiddleware, handleUploadErrors } from '../middlewares/upload.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', imageController.getImages as any);

// Rutas protegidas (admin)
router.post('/', [
  authMiddleware,
  isAdmin,
  uploadMiddleware,
  handleUploadErrors,
  imageController.createImage
] as any[]);

router.put('/:id', [
  authMiddleware,
  isAdmin,
  imageController.updateImage
] as any[]);

router.delete('/:id', [
  authMiddleware,
  isAdmin,
  imageController.deleteImage
] as any[]);

export const imageRouter = router;
export default router; 