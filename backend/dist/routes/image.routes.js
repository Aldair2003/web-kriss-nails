import { Router } from 'express';
import { imageController } from '../controllers/image.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { uploadMiddleware, handleUploadErrors, multipleUploadMiddleware } from '../middlewares/upload.middleware.js';
const router = Router();
// Rutas públicas
router.get('/', imageController.getImages);
router.get('/gallery', imageController.getGalleryImages);
router.get('/before-after', imageController.getBeforeAfterImages);
router.get('/service/:serviceId', imageController.getServiceImages);
router.get('/:id', imageController.getImageById);
// Rutas protegidas (admin)
router.post('/', [
    authMiddleware,
    isAdmin,
    uploadMiddleware,
    handleUploadErrors,
    imageController.createImage
]);
router.post('/before-after', [
    authMiddleware,
    isAdmin,
    multipleUploadMiddleware,
    handleUploadErrors,
    imageController.createBeforeAfterImage
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
