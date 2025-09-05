import { Router } from 'express';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { PublicHoursService } from '../services/public-hours.service.js';
import { AvailabilityService } from '../services/availability.service.js';
const router = Router();
const publicHoursService = new PublicHoursService();
const availabilityService = new AvailabilityService();
// ===== RUTAS PÚBLICAS PARA CLIENTES (SIN AUTENTICACIÓN) =====
// GET /api/public-hours/client/grouped - Obtener horarios agrupados para cliente
router.get('/client/grouped', (async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate y endDate son requeridos'
            });
        }
        const groupedHours = await publicHoursService.getPublicHoursGroupedByDate(new Date(startDate), new Date(endDate));
        res.json(groupedHours);
    }
    catch (error) {
        console.error('Error obteniendo horarios públicos para cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// GET /api/public-hours/client/date/:date - Obtener horarios de una fecha para cliente
router.get('/client/date/:date', (async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ error: 'Fecha es requerida' });
        }
        console.log('🔍 Debug - Fecha recibida del cliente:', date);
        // Crear la fecha correctamente para evitar problemas de zona horaria
        const [year, month, day] = date.split('-').map(Number);
        const correctDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        console.log('🔍 Debug - Fecha corregida para cliente:', correctDate.toISOString());
        const publicHours = await publicHoursService.getPublicHoursByDate(correctDate);
        const hours = publicHours.map(ph => ph.hour).sort();
        res.json(hours);
    }
    catch (error) {
        console.error('Error obteniendo horarios públicos para cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// GET /api/public-hours/client/check/:date/:hour - Verificar disponibilidad para cliente
router.get('/client/check/:date/:hour', (async (req, res) => {
    try {
        const { date, hour } = req.params;
        if (!date || !hour) {
            return res.status(400).json({
                error: 'date y hour son requeridos'
            });
        }
        console.log('🔍 Debug - Verificando disponibilidad para fecha:', date, 'hora:', hour);
        // Crear la fecha correctamente para evitar problemas de zona horaria
        const [year, month, day] = date.split('-').map(Number);
        const correctDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        console.log('🔍 Debug - Fecha corregida para verificación:', correctDate.toISOString());
        const isAvailable = await publicHoursService.isPublicHourAvailable(correctDate, hour);
        res.json({
            date,
            hour,
            isAvailable
        });
    }
    catch (error) {
        console.error('Error verificando disponibilidad para cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// ===== RUTAS PROTEGIDAS PARA ADMIN (CON AUTENTICACIÓN) =====
// Todas las rutas requieren autenticación de admin
router.use([authMiddleware, isAdmin]);
// POST /api/public-hours - Crear horario público
router.post('/', (async (req, res) => {
    try {
        const { availabilityId, hour, isAvailable } = req.body;
        if (!availabilityId || !hour) {
            return res.status(400).json({
                error: 'availabilityId y hour son requeridos'
            });
        }
        const publicHour = await publicHoursService.createPublicHour({
            availabilityId,
            hour,
            isAvailable
        });
        res.json({
            message: 'Horario público creado correctamente',
            publicHour
        });
    }
    catch (error) {
        console.error('Error creando horario público:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
}));
// GET /api/public-hours/date/:date - Obtener horarios públicos de una fecha
router.get('/date/:date', (async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ error: 'Fecha es requerida' });
        }
        const publicHours = await publicHoursService.getPublicHoursByDate(new Date(date));
        res.json(publicHours);
    }
    catch (error) {
        console.error('Error obteniendo horarios públicos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// GET /api/public-hours/range - Obtener horarios públicos de un rango
router.get('/range', (async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate y endDate son requeridos'
            });
        }
        const publicHours = await publicHoursService.getPublicHoursByDateRange(new Date(startDate), new Date(endDate));
        res.json(publicHours);
    }
    catch (error) {
        console.error('Error obteniendo horarios públicos por rango:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// GET /api/public-hours/grouped - Obtener horarios agrupados por fecha
router.get('/grouped', (async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate y endDate son requeridos'
            });
        }
        const groupedHours = await publicHoursService.getPublicHoursGroupedByDate(new Date(startDate), new Date(endDate));
        res.json(groupedHours);
    }
    catch (error) {
        console.error('Error obteniendo horarios agrupados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// PUT /api/public-hours/:id - Actualizar horario público
router.put('/:id', (async (req, res) => {
    try {
        const { id } = req.params;
        const { hour, isAvailable } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'ID es requerido' });
        }
        const publicHour = await publicHoursService.updatePublicHour(id, {
            hour,
            isAvailable
        });
        res.json({
            message: 'Horario público actualizado correctamente',
            publicHour
        });
    }
    catch (error) {
        console.error('Error actualizando horario público:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
}));
// DELETE /api/public-hours/:id - Eliminar horario público
router.delete('/:id', (async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID es requerido' });
        }
        const wasDeleted = await publicHoursService.deletePublicHour(id);
        if (wasDeleted) {
            res.json({
                message: 'Horario público eliminado correctamente',
                deleted: true
            });
        }
        else {
            res.status(404).json({
                message: 'Horario público no encontrado',
                deleted: false
            });
        }
    }
    catch (error) {
        console.error('Error eliminando horario público:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
// POST /api/public-hours/multiple - Crear múltiples horarios para una fecha
router.post('/multiple', (async (req, res) => {
    try {
        const { date, hours } = req.body;
        if (!date || !hours || !Array.isArray(hours)) {
            return res.status(400).json({
                error: 'date y hours (array) son requeridos'
            });
        }
        console.log('🔍 Debug - Fecha recibida del frontend:', date);
        // Crear la fecha correctamente para evitar problemas de zona horaria
        // La fecha viene como 'YYYY-MM-DD', necesitamos asegurarnos de que se interprete correctamente
        const [year, month, day] = date.split('-').map(Number);
        const correctDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria
        console.log('🔍 Debug - Fecha corregida:', correctDate.toISOString());
        // Primero habilitar el día si no existe
        const availability = await availabilityService.enableDate(correctDate);
        // Luego crear los horarios públicos
        const publicHours = await publicHoursService.createMultiplePublicHours(availability.id, hours);
        res.json({
            message: `Se han creado ${publicHours.length} horarios públicos`,
            publicHours
        });
    }
    catch (error) {
        console.error('Error creando múltiples horarios públicos:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
}));
// GET /api/public-hours/check/:date/:hour - Verificar disponibilidad de horario
router.get('/check/:date/:hour', (async (req, res) => {
    try {
        const { date, hour } = req.params;
        if (!date || !hour) {
            return res.status(400).json({
                error: 'date y hour son requeridos'
            });
        }
        const isAvailable = await publicHoursService.isPublicHourAvailable(new Date(date), hour);
        res.json({
            date,
            hour,
            isAvailable
        });
    }
    catch (error) {
        console.error('Error verificando disponibilidad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));
export const publicHoursRouter = router;
export default router;
