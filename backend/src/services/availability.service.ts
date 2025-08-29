import { PrismaClient, Availability } from '@prisma/client';
import { addDays, setHours, setMinutes, isWithinInterval } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'America/Guayaquil'; // Zona horaria de Ecuador

interface TimeSlot {
  start: Date;
  end: Date;
}

interface BlockedDate {
  date: Date;
  reason?: string;
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

  async createAvailability(date: Date): Promise<Availability> {
    const zonedDate = toZonedTime(date, TIMEZONE);
    
    // Verificar si ya existe una disponibilidad para esta fecha
    const existing = await prisma.availability.findFirst({
      where: {
        date: {
          gte: setHours(zonedDate, 0),
          lt: addDays(setHours(zonedDate, 0), 1),
        }
      }
    });

    if (existing) {
      // Si existe y está bloqueada, la desbloqueamos
      if (!existing.isAvailable) {
        return await prisma.availability.update({
          where: { id: existing.id },
          data: { isAvailable: true }
        });
      }
      // Si ya está disponible, la retornamos
      return existing;
    }

    // Crear nueva disponibilidad
    return await prisma.availability.create({
      data: {
        date: zonedDate,
        isAvailable: true
      }
    });
  }

  async blockDate(date: Date, reason?: string): Promise<Availability> {
    const zonedDate = toZonedTime(date, TIMEZONE);
    return await prisma.availability.create({
      data: {
        date: zonedDate,
        isAvailable: false
      }
    });
  }

  async unblockDate(id: string): Promise<Availability> {
    return await prisma.availability.delete({
      where: { id }
    });
  }

  async closeDate(date: Date): Promise<Availability> {
    const zonedDate = toZonedTime(date, TIMEZONE);
    
    // Verificar si ya existe una disponibilidad para esta fecha
    const existing = await prisma.availability.findFirst({
      where: {
        date: {
          gte: setHours(zonedDate, 0),
          lt: addDays(setHours(zonedDate, 0), 1),
        }
      }
    });

    if (existing) {
      // Si existe y está disponible, la cerramos
      if (existing.isAvailable) {
        return await prisma.availability.update({
          where: { id: existing.id },
          data: { isAvailable: false }
        });
      }
      // Si ya está cerrada, la retornamos
      return existing;
    }

    // Crear nueva disponibilidad cerrada
    return await prisma.availability.create({
      data: {
        date: zonedDate,
        isAvailable: false
      }
    });
  }

  async getAvailableDates(startDate: Date, endDate: Date): Promise<Availability[]> {
    return await prisma.availability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
  }

  async getBlockedDates(startDate: Date, endDate: Date): Promise<Availability[]> {
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
} 