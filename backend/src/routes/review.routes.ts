import { Router } from 'express';
import {
  getReviews,
  createReview,
  getAllReviews,
  approveReview,
  replyToReview,
  markAsRead,
  getUnreadReviewsCount,
  getPendingReviewsCount,
  deleteReview
} from '../controllers/review.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.get('/', getReviews as any); // Solo muestra reseñas aprobadas
router.post('/', createReview as any); // Cualquiera puede crear una reseña

// Rutas protegidas (admin)
router.get('/all', [authMiddleware, isAdmin, getAllReviews] as any[]); // Ver todas las reseñas incluyendo no aprobadas
router.get('/unread/count', [authMiddleware, isAdmin, getUnreadReviewsCount] as any[]);
router.get('/pending/count', [authMiddleware, isAdmin, getPendingReviewsCount] as any[]);
router.put('/:id/approve', [authMiddleware, isAdmin, approveReview] as any[]);
router.put('/:id/reply', [authMiddleware, isAdmin, replyToReview] as any[]);
router.put('/:id/read', [authMiddleware, isAdmin, markAsRead] as any[]);
router.delete('/:id', [authMiddleware, isAdmin, deleteReview] as any[]);

export const reviewRouter = router;
export default router; 