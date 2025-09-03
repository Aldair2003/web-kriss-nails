import { PrismaClient } from '@prisma/client';
import { createNotFoundError } from '../config/error.handler.js';
import { addDays } from 'date-fns';
import { emailService } from '../services/email.service.js';
const prisma = new PrismaClient();
export const getAppointments = async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const skip = (page - 1) * limit;
        // Construir los filtros
        const filters = [];
        if (req.query.status) {
            filters.push({ status: req.query.status });
        }
        if (req.query.startDate) {
            filters.push({ date: { gte: new Date(req.query.startDate) } });
        }
        if (req.query.endDate) {
            filters.push({ date: { lte: new Date(req.query.endDate) } });
        }
        if (req.query.search) {
            filters.push({
                OR: [
                    { clientName: { contains: req.query.search, mode: 'insensitive' } },
                    { clientPhone: { contains: req.query.search } },
                    { clientEmail: { contains: req.query.search, mode: 'insensitive' } }
                ]
            });
        }
        // Construir el where final
        const where = filters.length > 0 ? { AND: filters } : {};
        // Obtener total de registros para la paginación
        const total = await prisma.appointment.count({ where });
        // Obtener las citas con paginación y filtros
        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                service: true
            },
            orderBy: {
                date: 'asc'
            },
            skip,
            take: limit
        });
        // ✅ Agregar headers para evitar cache
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.json({
            appointments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        throw error;
    }
};
export const getAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                service: true
            }
        });
        if (!appointment) {
            throw createNotFoundError('Cita');
        }
        return res.json(appointment);
    }
    catch (error) {
        throw error;
    }
};
export const createAppointment = async (req, res) => {
    try {
        const { clientName, clientPhone, clientEmail, serviceId, date, notes } = req.body;
        // ✅ SOLUCIÓN: El frontend envía fechas en formato local sin 'Z'
        // La fecha viene como ISO string sin zona horaria, la interpretamos como hora local
        // Necesitamos crear la fecha en hora local de Ecuador (GMT-5)
        const [year, month, day, hour, minute, second] = date.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/).slice(1).map(Number);
        // ✅ CORREGIDO: Crear fecha en UTC pero ajustando la hora para Ecuador
        // Si el frontend envía 6:00 AM Ecuador, necesitamos guardar 11:00 AM UTC
        // (6:00 AM Ecuador = 11:00 AM UTC)
        // Forzar UTC para consistencia entre localhost y producción
        const appointmentDate = new Date(Date.UTC(year, month - 1, day, hour + 5, minute, second));
        // Debug: Ver qué fecha está buscando
        console.log('🔍 Backend - Fecha recibida:', date);
        console.log('🔍 Backend - appointmentDate:', appointmentDate);
        console.log('🔍 Backend - appointmentDate.toISOString():', appointmentDate.toISOString());
        console.log('🔍 Backend - appointmentDate.toLocaleString():', appointmentDate.toLocaleString());
        console.log('🔍 Backend - Zona horaria del servidor:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        // Crear startOfDay en la zona horaria local del servidor
        const startOfDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        console.log('🔍 Backend - startOfDay:', startOfDay);
        // PASO 1: Obtener información del servicio (incluyendo duración)
        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        });
        if (!service) {
            throw new Error('Servicio no encontrado');
        }
        // PASO 2: Verificar que el día esté habilitado en Availability
        // Buscar el día exacto en la DB (medianoche UTC)
        const dayToFind = new Date(appointmentDate);
        dayToFind.setUTCHours(0, 0, 0, 0); // Resetear a medianoche UTC
        console.log('🔍 Backend - Buscando día exacto:', dayToFind.toISOString());
        const dayAvailability = await prisma.availability.findFirst({
            where: {
                date: dayToFind,
                isAvailable: true
            }
        });
        console.log('🔍 Backend - Día encontrado:', dayAvailability);
        // Debug: Ver todos los días habilitados
        const allAvailableDays = await prisma.availability.findMany({
            where: {
                isAvailable: true
            },
            orderBy: {
                date: 'asc'
            }
        });
        console.log('🔍 Backend - Todos los días habilitados en DB:', allAvailableDays.map(d => d.date));
        if (!dayAvailability) {
            throw new Error('Este día no está habilitado para citas. Solo se pueden crear citas en días habilitados.');
        }
        // PASO 3: Calcular el fin de la cita basado en la duración del servicio
        const appointmentEnd = new Date(appointmentDate);
        appointmentEnd.setMinutes(appointmentEnd.getMinutes() + service.duration);
        console.log('🔍 Backend - Duración del servicio:', service.duration, 'minutos');
        console.log('🔍 Backend - Hora de inicio:', appointmentDate.toLocaleTimeString());
        console.log('🔍 Backend - Hora de fin calculada:', appointmentEnd.toLocaleTimeString());
        // PASO 4: Verificar conflictos con citas existentes (considerando duración)
        const conflictingAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lt: addDays(startOfDay, 1)
                },
                status: {
                    in: ['CONFIRMED', 'PENDING']
                }
            },
            include: {
                service: true
            }
        });
        // Verificar cada cita existente para conflictos de tiempo
        for (const existingAppointment of conflictingAppointments) {
            const existingStart = new Date(existingAppointment.date);
            const existingEnd = new Date(existingAppointment.date);
            existingEnd.setMinutes(existingEnd.getMinutes() + existingAppointment.service.duration);
            // Verificar si hay solapamiento de horarios
            const hasConflict = ((appointmentDate >= existingStart && appointmentDate < existingEnd) || // Nueva cita empieza durante cita existente
                (appointmentEnd > existingStart && appointmentEnd <= existingEnd) || // Nueva cita termina durante cita existente
                (appointmentDate <= existingStart && appointmentEnd >= existingEnd) // Nueva cita envuelve cita existente
            );
            if (hasConflict) {
                const statusText = existingAppointment.status === 'CONFIRMED' ? 'confirmada' : 'pendiente';
                throw new Error(`Conflicto de horario: Ya existe una cita ${statusText} que se solapa con este horario`);
            }
        }
        const appointment = await prisma.appointment.create({
            data: {
                clientName,
                clientPhone,
                clientEmail,
                serviceId,
                date: appointmentDate,
                notes,
                status: 'PENDING'
            },
            include: {
                service: true
            }
        });
        // ✅ PASO 5: Enviar email de confirmación al cliente (asíncrono)
        if (clientEmail) {
            console.log('📧 Enviando email de confirmación a:', clientEmail);
            emailService.sendAppointmentConfirmation(clientEmail, {
                clientName,
                serviceName: service.name,
                date: appointmentDate,
                time: appointmentDate.toLocaleTimeString('es-EC', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            }).then(() => {
                console.log('✅ Email de confirmación enviado exitosamente');
            }).catch((emailError) => {
                console.error('❌ Error al enviar email de confirmación:', emailError);
                // No interrumpimos el flujo si falla el email
                // La cita se crea exitosamente aunque falle el email
            });
        }
        else {
            console.log('ℹ️ No se envió email: cliente no proporcionó email');
        }
        return res.status(201).json({
            message: 'Cita creada exitosamente',
            data: appointment
        });
    }
    catch (error) {
        console.error('❌ Error en createAppointment:', error);
        return res.status(400).json({
            message: error instanceof Error ? error.message : 'Error al crear la cita'
        });
    }
};
export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date, notes } = req.body;
        // Obtener la cita actual para validaciones
        const currentAppointment = await prisma.appointment.findUnique({
            where: { id },
            include: { service: true }
        });
        if (!currentAppointment) {
            throw new Error('Cita no encontrada');
        }
        // ✅ VALIDACIONES DE TRANSICIÓN DE ESTADO
        if (status) {
            const currentStatus = currentAppointment.status;
            // No permitir cambios desde estados finales
            if (currentStatus === 'COMPLETED') {
                throw new Error('No se puede modificar una cita completada');
            }
            if (currentStatus === 'CANCELLED') {
                throw new Error('No se puede modificar una cita cancelada');
            }
            // Validar transiciones válidas
            const validTransitions = {
                'PENDING': ['CONFIRMED', 'CANCELLED'],
                'CONFIRMED': ['COMPLETED', 'CANCELLED'],
                'COMPLETED': [], // Estado final
                'CANCELLED': [] // Estado final
            };
            if (!validTransitions[currentStatus].includes(status)) {
                throw new Error(`No se puede cambiar de ${currentStatus} a ${status}`);
            }
        }
        // Si se está cambiando la fecha, validar que el nuevo día esté habilitado
        if (date) {
            const newAppointmentDate = new Date(date);
            const startOfDay = new Date(newAppointmentDate.getFullYear(), newAppointmentDate.getMonth(), newAppointmentDate.getDate());
            // Verificar que el nuevo día esté habilitado
            const dayAvailability = await prisma.availability.findFirst({
                where: {
                    date: startOfDay,
                    isAvailable: true
                }
            });
            if (!dayAvailability) {
                throw new Error('No se puede mover la cita a un día no habilitado. Solo se permiten días habilitados.');
            }
            // Calcular el fin de la cita basado en la duración del servicio
            const appointmentEnd = new Date(newAppointmentDate);
            appointmentEnd.setMinutes(appointmentEnd.getMinutes() + currentAppointment.service.duration);
            // Verificar conflictos con citas existentes (considerando duración)
            const conflictingAppointments = await prisma.appointment.findMany({
                where: {
                    date: {
                        gte: startOfDay,
                        lt: addDays(startOfDay, 1)
                    },
                    status: {
                        in: ['CONFIRMED', 'PENDING']
                    },
                    id: { not: id } // Excluir la cita actual
                },
                include: {
                    service: true
                }
            });
            // Verificar cada cita existente para conflictos de tiempo
            for (const existingAppointment of conflictingAppointments) {
                const existingStart = new Date(existingAppointment.date);
                const existingEnd = new Date(existingAppointment.date);
                existingEnd.setMinutes(existingEnd.getMinutes() + existingAppointment.service.duration);
                // Verificar si hay solapamiento de horarios
                const hasConflict = ((newAppointmentDate >= existingStart && newAppointmentDate < existingEnd) || // Nueva cita empieza durante cita existente
                    (appointmentEnd > existingStart && appointmentEnd <= existingEnd) || // Nueva cita termina durante cita existente
                    (newAppointmentDate <= existingStart && appointmentEnd >= existingEnd) // Nueva cita envuelve cita existente
                );
                if (hasConflict) {
                    const statusText = existingAppointment.status === 'CONFIRMED' ? 'confirmada' : 'pendiente';
                    throw new Error(`Conflicto de horario: Ya existe una cita ${statusText} que se solapa con este horario`);
                }
            }
        }
        // Actualizar la cita
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                status,
                date: date ? new Date(date) : undefined,
                notes: notes !== undefined ? notes : undefined
            },
            include: {
                service: true
            }
        });
        // ✅ ENVIAR EMAILS AUTOMÁTICOS POR CAMBIO DE ESTADO
        if (status && status !== currentAppointment.status && currentAppointment.clientEmail) {
            try {
                console.log(`📧 Enviando email por cambio de estado: ${currentAppointment.status} → ${status}`);
                const appointmentDate = new Date(currentAppointment.date);
                const timeString = appointmentDate.toLocaleTimeString('es-EC', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                switch (status) {
                    case 'CONFIRMED':
                        await emailService.sendAppointmentConfirmation(currentAppointment.clientEmail, {
                            clientName: currentAppointment.clientName,
                            serviceName: currentAppointment.service.name,
                            date: appointmentDate,
                            time: timeString
                        });
                        console.log('✅ Email de confirmación enviado');
                        break;
                    case 'CANCELLED':
                        await emailService.sendAppointmentCancellation(currentAppointment.clientEmail, {
                            clientName: currentAppointment.clientName,
                            serviceName: currentAppointment.service.name,
                            date: appointmentDate,
                            time: timeString
                        });
                        console.log('✅ Email de cancelación enviado');
                        break;
                    case 'COMPLETED':
                        // Enviar email de agradecimiento
                        await emailService.sendAppointmentCompletion(currentAppointment.clientEmail, {
                            clientName: currentAppointment.clientName,
                            serviceName: currentAppointment.service.name,
                            date: appointmentDate,
                            time: timeString
                        });
                        console.log('✅ Email de completado enviado');
                        break;
                }
            }
            catch (emailError) {
                console.error('❌ Error al enviar email por cambio de estado:', emailError);
                // No interrumpimos el flujo si falla el email
            }
        }
        return res.json({
            message: 'Cita actualizada exitosamente',
            data: updatedAppointment
        });
    }
    catch (error) {
        console.error('❌ Error en updateAppointment:', error);
        return res.status(400).json({
            message: error instanceof Error ? error.message : 'Error al actualizar la cita'
        });
    }
};
export const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.appointment.delete({
            where: { id }
        });
        return res.status(200).json({
            message: 'Cita eliminada exitosamente'
        });
    }
    catch (error) {
        throw error;
    }
};
// Nueva función para obtener slots disponibles considerando duración de servicios
export const getAvailableSlots = async (req, res) => {
    try {
        const { startDate, endDate, serviceId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Se requieren startDate y endDate'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Obtener información del servicio si se proporciona
        let serviceDuration = 60; // Duración por defecto (1 hora)
        if (serviceId) {
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            });
            if (service) {
                serviceDuration = service.duration;
            }
        }
        // Obtener días habilitados en el rango
        const availableDays = await prisma.availability.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                },
                isAvailable: true
            },
            orderBy: {
                date: 'asc'
            }
        });
        // Obtener citas existentes en el rango con sus servicios
        const existingAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                },
                status: { in: ['CONFIRMED', 'PENDING'] }
            },
            include: {
                service: true
            }
        });
        // Generar slots disponibles (cada 30 minutos de 6 AM a 11 PM)
        const slots = [];
        for (const day of availableDays) {
            const dayDate = new Date(day.date);
            // Generar slots de 6 AM a 11 PM (cada 30 minutos)
            for (let hour = 6; hour < 23; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const slotTime = new Date(dayDate);
                    slotTime.setHours(hour, minute, 0, 0);
                    // Calcular el fin del slot basado en la duración del servicio
                    const slotEnd = new Date(slotTime);
                    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
                    // Verificar si hay conflictos con citas existentes
                    let isAvailable = true;
                    let conflictReason = '';
                    for (const existingAppointment of existingAppointments) {
                        const existingStart = new Date(existingAppointment.date);
                        const existingEnd = new Date(existingAppointment.date);
                        existingEnd.setMinutes(existingEnd.getMinutes() + existingAppointment.service.duration);
                        // Verificar solapamiento
                        const hasConflict = ((slotTime >= existingStart && slotTime < existingEnd) ||
                            (slotEnd > existingStart && slotEnd <= existingEnd) ||
                            (slotTime <= existingStart && slotEnd >= existingEnd));
                        if (hasConflict) {
                            isAvailable = false;
                            const statusText = existingAppointment.status === 'CONFIRMED' ? 'confirmada' : 'pendiente';
                            conflictReason = `Conflicto con cita ${statusText} (${existingAppointment.service.name})`;
                            break;
                        }
                    }
                    // Verificar que el slot termine antes de las 11 PM
                    if (slotEnd.getHours() > 23 || (slotEnd.getHours() === 23 && slotEnd.getMinutes() > 0)) {
                        isAvailable = false;
                        conflictReason = 'Horario fuera del rango de trabajo (6 AM - 11 PM)';
                    }
                    slots.push({
                        date: slotTime.toISOString(),
                        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                        available: isAvailable,
                        appointmentId: undefined,
                        status: undefined,
                        conflictReason: conflictReason || undefined
                    });
                }
            }
        }
        return res.json({
            slots,
            totalSlots: slots.length,
            availableSlots: slots.filter(slot => slot.available).length,
            bookedSlots: slots.filter(slot => !slot.available).length,
            serviceDuration
        });
    }
    catch (error) {
        console.error('Error al obtener slots disponibles:', error);
        return res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};
