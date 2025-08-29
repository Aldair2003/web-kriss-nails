import { Router } from 'express';
import { getReviews, createReview, getAllReviews, approveReview, replyToReview, markAsRead, getUnreadReviewsCount, getPendingReviewsCount, deleteReview } from '../controllers/review.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas públicas
router.get('/', getReviews); // Solo muestra reseñas aprobadas
router.post('/', createReview); // Cualquiera puede crear una reseña
// Rutas protegidas (admin)
router.get('/all', [authMiddleware, isAdmin, getAllReviews]); // Ver todas las reseñas incluyendo no aprobadas
router.get('/unread/count', [authMiddleware, isAdmin, getUnreadReviewsCount]);
router.get('/pending/count', [authMiddleware, isAdmin, getPendingReviewsCount]);
router.put('/:id/approve', [authMiddleware, isAdmin, approveReview]);
router.put('/:id/reply', [authMiddleware, isAdmin, replyToReview]);
router.put('/:id/read', [authMiddleware, isAdmin, markAsRead]);
router.delete('/:id', [authMiddleware, isAdmin, deleteReview]);
export const reviewRouter = router;
export default router;
