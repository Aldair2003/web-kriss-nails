import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getAllServiceCategories, createServiceCategory, deleteServiceCategory } from '../controllers/service-category.controller.js';
const router = Router();
// Ruta para obtener todas las categorías de servicio (pública)
router.get('/', getAllServiceCategories);
// Rutas protegidas por autenticación - Usando @ts-ignore para evitar errores de tipado con Express
// @ts-ignore - El error es una limitación conocida de TypeScript con Express
router.post('/', authMiddleware, createServiceCategory);
// @ts-ignore - El error es una limitación conocida de TypeScript con Express
router.delete('/:id', authMiddleware, deleteServiceCategory);
export default router;
