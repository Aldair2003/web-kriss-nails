import { Router } from 'express';
import { getServices, getService, createService, updateService, deleteService } from '../controllers/service.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas públicas
router.get('/', getServices);
router.get('/:id', getService);
// Rutas protegidas (admin)
router.post('/', [authMiddleware, isAdmin, createService]);
router.put('/:id', [authMiddleware, isAdmin, updateService]);
router.delete('/:id', [authMiddleware, isAdmin, deleteService]);
export const serviceRouter = router;
export default router;
