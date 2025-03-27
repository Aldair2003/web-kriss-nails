import { Router } from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
} from '../controllers/service.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', getServices as any);
router.get('/:id', getService as any);

// Rutas protegidas (admin)
router.post('/', [authMiddleware, isAdmin, createService] as any[]);
router.put('/:id', [authMiddleware, isAdmin, updateService] as any[]);
router.delete('/:id', [authMiddleware, isAdmin, deleteService] as any[]);

export const serviceRouter = router;
export default router; 