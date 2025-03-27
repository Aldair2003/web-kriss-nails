import { Request, Response } from 'express';
import { PrismaClient, AppointmentStatus, Prisma } from '@prisma/client';
import { createNotFoundError } from '../config/error.handler.js';

const prisma = new PrismaClient();

interface GetAppointmentsQuery {
  page?: string;
  limit?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const getAppointments = async (req: Request<{}, {}, {}, GetAppointmentsQuery>, res: Response) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const skip = (page - 1) * limit;

    // Construir los filtros
    const filters: Prisma.AppointmentWhereInput[] = [];

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
          { clientName: { contains: req.query.search, mode: 'insensitive' as Prisma.QueryMode } },
          { clientPhone: { contains: req.query.search } },
          { clientEmail: { contains: req.query.search, mode: 'insensitive' as Prisma.QueryMode } }
        ]
      });
    }

    // Construir el where final
    const where: Prisma.AppointmentWhereInput = filters.length > 0 ? { AND: filters } : {};

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

    return res.json({
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    throw error;
  }
};

export const getAppointment = async (req: Request, res: Response) => {
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
  } catch (error) {
    throw error;
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { clientName, clientPhone, clientEmail, serviceId, date, notes } = req.body;

    // Verificar disponibilidad
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: new Date(date),
        status: 'CONFIRMED'
      }
    });

    if (existingAppointment) {
      throw new Error('Horario no disponible');
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientName,
        clientPhone,
        clientEmail,
        serviceId,
        date: new Date(date),
        notes,
        status: 'PENDING'
      },
      include: {
        service: true
      }
    });

    return res.status(201).json({
      message: 'Cita creada exitosamente',
      data: appointment
    });
  } catch (error) {
    throw error;
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, date } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        date: date ? new Date(date) : undefined
      },
      include: {
        service: true
      }
    });

    return res.json({
      message: 'Cita actualizada exitosamente',
      data: appointment
    });
  } catch (error) {
    throw error;
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    throw error;
  }
}; 