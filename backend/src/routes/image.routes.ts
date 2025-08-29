import { Router } from 'express';
import { imageController } from '../controllers/image.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { uploadMiddleware, handleUploadErrors, multipleUploadMiddleware } from '../middlewares/upload.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', imageController.getImages as any);
router.get('/gallery', imageController.getGalleryImages as any);
router.get('/before-after', imageController.getBeforeAfterImages as any);
router.get('/service/:serviceId', imageController.getServiceImages as any);
router.get('/:id', imageController.getImageById as any);

// Rutas protegidas (admin)
router.post('/', [
  authMiddleware,
  isAdmin,
  uploadMiddleware,
  handleUploadErrors,
  imageController.createImage
] as any[]);

router.post('/before-after', [
  authMiddleware,
  isAdmin,
  multipleUploadMiddleware,
  handleUploadErrors,
  imageController.createBeforeAfterImage
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