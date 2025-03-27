import { Router } from 'express';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Todas las rutas requieren autenticación
router.all('*', [authMiddleware]);
// Todas las rutas requieren ser admin
router.all('*', [isAdmin]);
// TODO: Implementar endpoints de usuarios
// GET /api/users - Obtener todos los usuarios
// GET /api/users/:id - Obtener un usuario específico
// PUT /api/users/:id - Actualizar un usuario
// DELETE /api/users/:id - Eliminar un usuario
export const userRouter = router;
export default router;
