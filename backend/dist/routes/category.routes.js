import { Router } from 'express';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory, updateCategoryOrder } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas públicas
router.get('/', getCategories);
router.get('/:id', getCategory);
// Rutas protegidas (solo admin)
router.post('/', authMiddleware, createCategory);
router.put('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);
router.put('/order/update', authMiddleware, updateCategoryOrder);
export default router;
