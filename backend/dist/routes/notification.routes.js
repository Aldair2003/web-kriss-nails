import { Router } from 'express';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { notificationController } from '../controllers/notification.controller.js';
const router = Router();
// Todas las rutas requieren autenticación
router.all('*', [authMiddleware]);
// Rutas para todos los usuarios autenticados
router.post('/whatsapp', (req, res) => {
    res.json({ message: 'Notificación WhatsApp enviada' });
});
// Rutas protegidas para administradores
router.all('/admin/*', [isAdmin]);
// Rutas de administración
router.get('/admin', (req, res) => {
    res.json({ message: 'Historial de notificaciones' });
});
router.post('/admin/bulk', (req, res) => {
    res.json({ message: 'Envío masivo de notificaciones' });
});
router.delete('/admin/:id', (req, res) => {
    res.json({ message: 'Eliminar notificación' });
});
// Rutas para el dashboard
router.get('/dashboard', [isAdmin, notificationController.getDashboardNotifications]);
// Marcar todas las notificaciones como leídas
router.put('/mark-all-read/:type', [isAdmin, notificationController.markAllAsRead]);
export const notificationRouter = router;
export default router;
