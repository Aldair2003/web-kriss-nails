import { Router } from 'express';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas públicas
// GET /api/availability - Obtener horarios disponibles
router.get('/', (req, res) => {
    res.json({ message: 'Horarios disponibles' });
});
// Rutas protegidas para administradores
router.all('/admin/*', [authMiddleware, isAdmin]);
// Rutas de administración
router.post('/admin', (req, res) => {
    res.json({ message: 'Crear disponibilidad' });
});
router.put('/admin/:id', (req, res) => {
    res.json({ message: 'Actualizar disponibilidad' });
});
router.delete('/admin/:id', (req, res) => {
    res.json({ message: 'Eliminar disponibilidad' });
});
export const availabilityRouter = router;
export default router;
