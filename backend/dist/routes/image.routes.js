import { Router } from 'express';
import { imageController } from '../controllers/image.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { uploadMiddleware, handleUploadErrors } from '../middlewares/upload.middleware.js';
const router = Router();
// Rutas públicas
router.get('/', imageController.getImages);
// Rutas protegidas (admin)
router.post('/', [
    authMiddleware,
    isAdmin,
    uploadMiddleware,
    handleUploadErrors,
    imageController.createImage
]);
router.put('/:id', [
    authMiddleware,
    isAdmin,
    imageController.updateImage
]);
router.delete('/:id', [
    authMiddleware,
    isAdmin,
    imageController.deleteImage
]);
export const imageRouter = router;
export default router;
