import { Router } from 'express';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots
} from '../controllers/appointment.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas protegidas (admin)
router.get('/', [
  authMiddleware,
  isAdmin,
  getAppointments
] as any[]);

router.get('/:id', [
  authMiddleware,
  isAdmin,
  getAppointment
] as any[]);

router.put('/:id', [
  authMiddleware,
  isAdmin,
  updateAppointment
] as any[]);

router.delete('/:id', [
  authMiddleware,
  isAdmin,
  deleteAppointment
] as any[]);

// Ruta pública para crear citas
router.post('/', [createAppointment] as any[]);

// Ruta para obtener slots disponibles (pública)
router.get('/available-slots', [getAvailableSlots] as any[]);

export const appointmentRouter = router;
export default router; 