import { Router } from 'express';
import { getAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment, getAvailableSlots } from '../controllers/appointment.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
const router = Router();
// Rutas protegidas (admin)
router.get('/', [
    authMiddleware,
    isAdmin,
    getAppointments
]);
router.get('/:id', [
    authMiddleware,
    isAdmin,
    getAppointment
]);
router.put('/:id', [
    authMiddleware,
    isAdmin,
    updateAppointment
]);
router.delete('/:id', [
    authMiddleware,
    isAdmin,
    deleteAppointment
]);
// Ruta pública para crear citas
router.post('/', [createAppointment]);
// Ruta para obtener slots disponibles (pública)
router.get('/available-slots', [getAvailableSlots]);
export const appointmentRouter = router;
export default router;
