import { PrismaClient, PublicHour, Availability } from '@prisma/client';

const prisma = new PrismaClient();

export interface PublicHourData {
  availabilityId: string;
  hour: string;
  isAvailable?: boolean;
}

export interface PublicHourWithAvailability extends PublicHour {
  availability: Availability;
}

export class PublicHoursService {
  /**
   * Crear un horario público
   */
  async createPublicHour(data: PublicHourData): Promise<PublicHour> {
    console.log('🔍 createPublicHour llamado con:', data);
    
    // Verificar que la disponibilidad existe
    const availability = await prisma.availability.findUnique({
      where: { id: data.availabilityId }
    });

    if (!availability) {
      throw new Error('La disponibilidad especificada no existe');
    }

    // Crear el horario público
    const publicHour = await prisma.publicHour.create({
      data: {
        availabilityId: data.availabilityId,
        hour: data.hour,
        isAvailable: data.isAvailable ?? true
      }
    });

    console.log('✅ Horario público creado:', publicHour);
    return publicHour;
  }

  /**
   * Obtener horarios públicos de una fecha específica
   */
  async getPublicHoursByDate(date: Date): Promise<PublicHourWithAvailability[]> {
    console.log('🔍 getPublicHoursByDate llamado con fecha:', date.toISOString());
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const publicHours = await prisma.publicHour.findMany({
      where: {
        availability: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          isAvailable: true
        },
        isAvailable: true
      },
      include: {
        availability: true
      },
      orderBy: {
        hour: 'asc'
      }
    });

    console.log('📅 Horarios públicos encontrados:', publicHours.length);
    return publicHours;
  }

  /**
   * Obtener horarios públicos de un rango de fechas
   */
  async getPublicHoursByDateRange(startDate: Date, endDate: Date): Promise<PublicHourWithAvailability[]> {
    console.log('🔍 getPublicHoursByDateRange llamado con:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const publicHours = await prisma.publicHour.findMany({
      where: {
        availability: {
          date: {
            gte: startDate,
            lte: endDate
          },
          isAvailable: true
        },
        isAvailable: true
      },
      include: {
        availability: true
      },
      orderBy: [
        { availability: { date: 'asc' } },
        { hour: 'asc' }
      ]
    });

    console.log('📅 Horarios públicos encontrados en rango:', publicHours.length);
    return publicHours;
  }

  /**
   * Actualizar un horario público
   */
  async updatePublicHour(id: string, data: Partial<PublicHourData>): Promise<PublicHour> {
    console.log('🔍 updatePublicHour llamado con id:', id, 'data:', data);

    const publicHour = await prisma.publicHour.update({
      where: { id },
      data: {
        ...(data.hour && { hour: data.hour }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable })
      }
    });

    console.log('✅ Horario público actualizado:', publicHour);
    return publicHour;
  }

  /**
   * Eliminar un horario público
   */
  async deletePublicHour(id: string): Promise<boolean> {
    console.log('🔍 deletePublicHour llamado con id:', id);

    try {
      await prisma.publicHour.delete({
        where: { id }
      });
      
      console.log('✅ Horario público eliminado');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando horario público:', error);
      return false;
    }
  }

  /**
   * Crear múltiples horarios públicos para una fecha
   */
  async createMultiplePublicHours(availabilityId: string, hours: string[]): Promise<PublicHour[]> {
    console.log('🔍 createMultiplePublicHours llamado con:', { availabilityId, hours });

    const publicHours = await Promise.all(
      hours.map(hour => 
        prisma.publicHour.upsert({
          where: {
            availabilityId_hour: {
              availabilityId,
              hour
            }
          },
          update: {
            isAvailable: true
          },
          create: {
            availabilityId,
            hour,
            isAvailable: true
          }
        })
      )
    );

    console.log('✅ Horarios públicos creados:', publicHours.length);
    return publicHours;
  }

  /**
   * Obtener horarios públicos agrupados por fecha
   */
  async getPublicHoursGroupedByDate(startDate: Date, endDate: Date): Promise<Record<string, string[]>> {
    console.log('🔍 getPublicHoursGroupedByDate llamado con:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const publicHours = await this.getPublicHoursByDateRange(startDate, endDate);
    
    const grouped: Record<string, string[]> = {};
    
    publicHours.forEach(ph => {
      const dateKey = ph.availability.date.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(ph.hour);
    });

    console.log('📅 Horarios agrupados por fecha:', Object.keys(grouped).length, 'fechas');
    return grouped;
  }

  /**
   * Verificar si una fecha y hora específica está disponible para el público
   */
  async isPublicHourAvailable(date: Date, hour: string): Promise<boolean> {
    console.log('🔍 isPublicHourAvailable llamado con:', {
      date: date.toISOString(),
      hour
    });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const publicHour = await prisma.publicHour.findFirst({
      where: {
        availability: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          isAvailable: true
        },
        hour,
        isAvailable: true
      }
    });

    const isAvailable = !!publicHour;
    console.log('📅 Horario público disponible:', isAvailable);
    return isAvailable;
  }
}
