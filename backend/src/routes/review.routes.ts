import { Router } from 'express';
import {
  getReviews,
  createReview,
  getAllReviews,
  approveReview,
  deleteReview
} from '../controllers/review.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', getReviews as any); // Solo muestra reseñas aprobadas
router.post('/', createReview as any); // Cualquiera puede crear una reseña

// Rutas protegidas (admin)
router.get('/all', [authMiddleware, isAdmin, getAllReviews] as any[]); // Ver todas las reseñas incluyendo no aprobadas
router.put('/:id/approve', [authMiddleware, isAdmin, approveReview] as any[]);
router.delete('/:id', [authMiddleware, isAdmin, deleteReview] as any[]);

export const reviewRouter = router;
export default router; 