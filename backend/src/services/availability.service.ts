import { PrismaClient, Availability } from '@prisma/client';
import { addDays, setHours, setMinutes, isWithinInterval } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'America/Guayaquil'; // Zona horaria de Ecuador

interface TimeSlot {
  start: Date;
  end: Date;
}

export class AvailabilityService {
  // Horario regular
  private regularHours = {
    start: { hour: 8, minute: 0 }, // 8:00 AM
    end: { hour: 18, minute: 0 }, // 6:00 PM
    breakStart: { hour: 13, minute: 0 }, // 1:00 PM
    breakEnd: { hour: 14, minute: 0 }, // 2:00 PM
  };

  // Días de descanso (0 = Domingo, 6 = Sábado)
  private daysOff = [0]; // Solo domingos cerrado

  async getAvailableSlots(date: Date, duration: number = 60): Promise<TimeSlot[]> {
    const zonedDate = toZonedTime(date, TIMEZONE);
    const dayOfWeek = zonedDate.getDay();

    // Verificar si es día de descanso
    if (this.daysOff.includes(dayOfWeek)) {
      return [];
    }

    // Obtener citas existentes para ese día
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: setHours(zonedDate, 0),
          lt: addDays(setHours(zonedDate, 0), 1),
        },
        status: {
          not: 'CANCELLED'
        }
      },
    });

    // Obtener bloqueos especiales
    const blockedTimes = await prisma.availability.findMany({
      where: {
        date: {
          gte: setHours(zonedDate, 0),
          lt: addDays(setHours(zonedDate, 0), 1),
        },
        isAvailable: false
      },
    });

    // Generar slots disponibles
    const slots: TimeSlot[] = [];
    let currentTime = setMinutes(
      setHours(zonedDate, this.regularHours.start.hour),
      this.regularHours.start.minute
    );
    const endTime = setMinutes(
      setHours(zonedDate, this.regularHours.end.hour),
      this.regularHours.end.minute
    );

    while (currentTime < endTime) {
      const slotEnd = addDays(currentTime, 0);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Verificar si el slot está dentro del horario de break
      const isBreakTime = this.isInBreakTime(currentTime);
      
      // Verificar si el slot está bloqueado
      const isBlocked = this.isTimeBlocked(currentTime, slotEnd, blockedTimes);
      
      // Verificar si hay citas que se solapan
      const isBooked = this.isTimeBooked(currentTime, slotEnd, appointments);

      if (!isBreakTime && !isBlocked && !isBooked && slotEnd <= endTime) {
        slots.push({
          start: new Date(formatInTimeZone(currentTime, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")),
          end: new Date(formatInTimeZone(slotEnd, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")),
        });
      }

      // Avanzar al siguiente slot (en intervalos de 15 minutos para mejor granularidad)
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  }

  private isInBreakTime(time: Date): boolean {
    const breakStart = setMinutes(
      setHours(time, this.regularHours.breakStart.hour),
      this.regularHours.breakStart.minute
    );
    const breakEnd = setMinutes(
      setHours(time, this.regularHours.breakEnd.hour),
      this.regularHours.breakEnd.minute
    );

    return isWithinInterval(time, { start: breakStart, end: breakEnd });
  }

  private isTimeBlocked(start: Date, end: Date, blockedTimes: Availability[]): boolean {
    return blockedTimes.some(block => {
      const blockStart = new Date(block.date);
      const blockEnd = new Date(block.date);
      blockEnd.setMinutes(blockEnd.getMinutes() + 60); // Asumimos bloques de 1 hora

      return (
        (start >= blockStart && start < blockEnd) ||
        (end > blockStart && end <= blockEnd) ||
        (start <= blockStart && end >= blockEnd)
      );
    });
  }

  private isTimeBooked(start: Date, end: Date, appointments: any[]): boolean {
    return appointments.some(apt => {
      const aptStart = new Date(apt.date);
      const aptEnd = new Date(apt.date);
      aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration || 60);

      return (
        (start >= aptStart && start < aptEnd) ||
        (end > aptStart && end <= aptEnd) ||
        (start <= aptStart && end >= aptEnd)
      );
    });
  }

  /**
   * Habilitar un día para trabajo
   * @param date Fecha a habilitar
   * @returns Disponibilidad creada o actualizada
   */
  async enableDate(date: Date): Promise<Availability> {
    // Usar la fecha exacta que viene del frontend SIN NINGUNA MODIFICACIÓN
    const exactDate = new Date(date);
    
    console.log('🔍 enableDate llamado con fecha:', date.toISOString());
    console.log('📅 Fecha original recibida:', date);
    console.log('📅 Fecha exacta (sin modificar):', exactDate.toISOString());
    
    // NO normalizar la fecha - usar exactamente la que viene del frontend
    const dateToUse = exactDate;
    
    console.log('📅 Fecha que se usará para la BD:', dateToUse.toISOString());
    
    // Buscar disponibilidad existente para ese día
    const existing = await prisma.availability.findFirst({
      where: {
        date: {
          gte: dateToUse,
          lt: new Date(dateToUse.getTime() + 24 * 60 * 60 * 1000) // +24 horas
        }
      }
    });

    console.log('🔍 Disponibilidad existente encontrada:', existing);

    if (existing) {
      // Si existe y está bloqueada, la habilitamos
      if (!existing.isAvailable) {
        console.log('✅ Habilitando disponibilidad existente para fecha:', existing.date);
        const updated = await prisma.availability.update({
          where: { id: existing.id },
          data: { isAvailable: true }
        });
        console.log('✅ Disponibilidad actualizada:', updated);
        return updated;
      }
      // Si ya está disponible, la retornamos
      console.log('ℹ️ Disponibilidad ya está habilitada para fecha:', existing.date);
      return existing;
    }

    // Crear nueva disponibilidad
    console.log('🆕 Creando nueva disponibilidad para fecha:', dateToUse);
    const created = await prisma.availability.create({
      data: {
        date: dateToUse,
        isAvailable: true
      }
    });
    console.log('✅ Nueva disponibilidad creada:', created);
    return created;
  }

  /**
   * Deshabilitar un día para trabajo
   * @param date Fecha a deshabilitar
   * @returns Disponibilidad actualizada o creada
   */
  async disableDate(date: Date): Promise<Availability> {
    // Usar la fecha exacta que viene del frontend SIN NINGUNA MODIFICACIÓN
    const exactDate = new Date(date);
    
    console.log('🔍 disableDate llamado con fecha:', date.toISOString());
    console.log('📅 Fecha exacta (sin modificar):', exactDate.toISOString());
    
    // NO normalizar la fecha - usar exactamente la que viene del frontend
    const dateToUse = exactDate;
    
    // Buscar disponibilidad existente para ese día
    const existing = await prisma.availability.findFirst({
      where: {
        date: {
          gte: dateToUse,
          lt: new Date(dateToUse.getTime() + 24 * 60 * 60 * 1000) // +24 horas
        }
      }
    });

    if (existing) {
      // Si existe, la marcamos como no disponible
      return await prisma.availability.update({
        where: { id: existing.id },
        data: { isAvailable: false }
      });
    }

    // Si no existe, creamos un bloqueo
    return await prisma.availability.create({
      data: {
        date: dateToUse,
        isAvailable: false
      }
    });
  }

  /**
   * Obtener todas las fechas disponibles
   * @returns Array de fechas disponibles
   */
  async getAllAvailabilities(): Promise<Availability[]> {
    console.log('🔍 getAllAvailabilities llamado');
    
    const availabilities = await prisma.availability.findMany({
      where: {
        isAvailable: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('📅 Total de disponibilidades encontradas:', availabilities.length);
    console.log('📅 Fechas disponibles:', availabilities.map(av => av.date.toISOString()));
    
    return availabilities;
  }

  /**
   * Obtener fechas disponibles en un rango
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Array de disponibilidades en el rango
   */
  async getAvailabilitiesInRange(startDate: Date, endDate: Date): Promise<Availability[]> {
    return await prisma.availability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        isAvailable: true
      },
      orderBy: {
        date: 'asc'
      }
    });
  }

  /**
   * Obtener fechas bloqueadas en un rango
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Array de fechas bloqueadas en el rango
   */
  async getBlockedDatesInRange(startDate: Date, endDate: Date): Promise<Availability[]> {
    return await prisma.availability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        isAvailable: false
      }
    });
  }

  /**
   * Eliminar completamente un día del sistema
   * @param date Fecha a eliminar
   * @returns true si se eliminó, false si no existía
   */
  async removeDate(date: Date): Promise<boolean> {
    // Usar la fecha exacta que viene del frontend SIN NINGUNA MODIFICACIÓN
    const exactDate = new Date(date);
    
    console.log('🔍 removeDate llamado con fecha:', date.toISOString());
    console.log('📅 Fecha exacta (sin modificar):', exactDate.toISOString());
    
    // NO normalizar la fecha - usar exactamente la que viene del frontend
    const dateToUse = exactDate;
    
    // Buscar disponibilidad existente para ese día
    const existing = await prisma.availability.findFirst({
      where: {
        date: {
          gte: dateToUse,
          lt: new Date(dateToUse.getTime() + 24 * 60 * 60 * 1000) // +24 horas
        }
      }
    });

    if (existing) {
      // Si existe, la eliminamos completamente
      await prisma.availability.delete({
        where: { id: existing.id }
      });
      return true;
    }

    // Si no existe, no hay nada que eliminar
    return false;
  }
} 