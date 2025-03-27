import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAppointments, createAppointment } from '../controllers/appointment.controller.js';

// Mock de Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    appointment: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }))
}));

describe('Appointment Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockReq = {
      query: {},
      body: {}
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('getAppointments', () => {
    it('debería retornar una lista paginada de citas', async () => {
      const mockAppointments = [
        {
          id: '1',
          clientName: 'Test Client',
          date: new Date(),
          status: 'PENDING'
        }
      ];

      (prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);
      (prisma.appointment.count as jest.Mock).mockResolvedValue(1);

      await getAppointments(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        data: mockAppointments,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });
    });
  });

  describe('createAppointment', () => {
    it('debería crear una nueva cita cuando el horario está disponible', async () => {
      const mockAppointmentData = {
        clientName: 'Test Client',
        clientPhone: '1234567890',
        clientEmail: 'test@example.com',
        serviceId: '1',
        date: new Date().toISOString(),
        notes: 'Test notes'
      };

      mockReq.body = mockAppointmentData;

      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.appointment.create as jest.Mock).mockResolvedValue({
        ...mockAppointmentData,
        id: '1',
        status: 'PENDING'
      });

      await createAppointment(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Cita creada exitosamente',
        data: expect.objectContaining({
          id: '1',
          status: 'PENDING'
        })
      });
    });
  });
}); 