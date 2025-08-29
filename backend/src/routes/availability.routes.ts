import { Router, Request, Response } from 'express';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { AvailabilityService } from '../services/availability.service.js';
import { Availability } from '@prisma/client';
import { format } from 'date-fns';

const router = Router();
const availabilityService = new AvailabilityService();

// Rutas públicas
// GET /api/availability?date=2024-01-15&duration=60
router.get('/', (async (req: Request, res: Response) => {
  try {
    const { date, duration } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const requestDate = new Date(date as string);
    const serviceDuration = duration ? parseInt(duration as string) : 60;

    const slots = await availabilityService.getAvailableSlots(requestDate, serviceDuration);
    
    // Formatear para el frontend
    const formattedSlots = slots.map(slot => ({
      date: format(slot.start, 'yyyy-MM-dd'),
      startTime: format(slot.start, 'HH:mm'),
      endTime: format(slot.end, 'HH:mm'),
      available: true
    }));

    res.json(formattedSlots);
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// GET /api/availability/dates?month=8&year=2025
router.get('/dates', (async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Mes y año son requeridos' });
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    
    // Obtener fechas disponibles de la base de datos
    const availabilities = await availabilityService.getAvailableDates(startDate, endDate);
    
    // Formatear fechas disponibles
    const availableDates = availabilities
      .filter((av: Availability) => av.isAvailable)
      .map((av: Availability) => format(av.date, 'yyyy-MM-dd'));

    res.json(availableDates);
  } catch (error) {
    console.error('Error obteniendo fechas disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// Rutas protegidas para administradores
router.all('/admin/*', [authMiddleware, isAdmin] as any[]);

// Rutas de administración
router.post('/admin', (async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const availability = await availabilityService.createAvailability(new Date(date));
    res.json(availability);
  } catch (error) {
    console.error('Error creando disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

router.delete('/admin/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await availabilityService.unblockDate(id);
    res.json({ message: 'Fecha cerrada' });
  } catch (error) {
    console.error('Error cerrando fecha:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// POST /api/availability/admin/close - Cerrar una fecha específica
router.post('/admin/close', (async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const availability = await availabilityService.closeDate(new Date(date));
    res.json({ message: 'Fecha cerrada', availability });
  } catch (error) {
    console.error('Error cerrando fecha:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

export const availabilityRouter = router;
export default router; 