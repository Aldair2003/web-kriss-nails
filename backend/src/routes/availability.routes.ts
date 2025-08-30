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

    console.log('🔍 GET /dates llamado con month:', month, 'year:', year);

    // Obtener SOLO las fechas que realmente se habilitaron
    const availabilities = await availabilityService.getAllAvailabilities();
    
    console.log('📅 Disponibilidades obtenidas del servicio:', availabilities);
    
    // Formatear fechas disponibles usando toISOString para evitar problemas de zona horaria
    const availableDates = availabilities
      .filter((av: Availability) => av.isAvailable)
      .map((av: Availability) => {
        // Usar toISOString().split('T')[0] para obtener YYYY-MM-DD sin problemas de zona horaria
        const formattedDate = av.date.toISOString().split('T')[0];
        console.log('📅 Formateando fecha:', av.date, '->', formattedDate);
        return formattedDate;
      });

    console.log('📅 Fechas formateadas finales:', availableDates);
    res.json(availableDates);
  } catch (error) {
    console.error('Error obteniendo fechas disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// Rutas protegidas para administradores
router.all('/admin/*', [authMiddleware, isAdmin] as any[]);

// POST /api/availability/admin/enable - Habilitar un día (alias para compatibilidad)
router.post('/admin/enable', (async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const availability = await availabilityService.enableDate(new Date(date));
    res.json({ 
      message: 'Día habilitado correctamente', 
      availability 
    });
  } catch (error) {
    console.error('Error habilitando día:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// POST /api/availability/admin/disable - Deshabilitar un día
router.post('/admin/disable', (async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const availability = await availabilityService.disableDate(new Date(date));
    res.json({ 
      message: 'Día deshabilitado correctamente', 
      availability 
    });
  } catch (error) {
    console.error('Error deshabilitando día:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// POST /api/availability/admin/enable-range - Habilitar rango de días
router.post('/admin/enable-range', (async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Fecha de inicio y fin son requeridas' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' });
    }

    // Habilitar cada día del rango
    const enabledDates = [];
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      const availability = await availabilityService.enableDate(currentDate);
      enabledDates.push(availability);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ 
      message: `Se han habilitado ${enabledDates.length} días`, 
      enabledDates 
    });
  } catch (error) {
    console.error('Error habilitando rango de días:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

// POST /api/availability/admin/remove - Eliminar un día completamente
router.post('/admin/remove', (async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }

    const wasRemoved = await availabilityService.removeDate(new Date(date));
    
    if (wasRemoved) {
      res.json({ 
        message: 'Día eliminado correctamente',
        removed: true
      });
    } else {
      res.json({ 
        message: 'El día no existía en el sistema',
        removed: false
      });
    }
  } catch (error) {
    console.error('Error eliminando día:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}) as any);

export const availabilityRouter = router;
export default router; 