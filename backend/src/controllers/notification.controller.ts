import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controlador de notificaciones para el panel de administración
 */
export const notificationController = {
  /**
   * Obtiene un resumen de notificaciones para el dashboard
   */
  getDashboardNotifications: async (_req: Request, res: Response): Promise<void> => {
    try {
      // Obtener conteo de reseñas no leídas
      const unreadReviews = await prisma.review.count({
        where: { isRead: false }
      });

      // Obtener conteo de reseñas pendientes de aprobación
      const pendingReviews = await prisma.review.count({
        where: { isApproved: false }
      });

      // Obtener conteo de citas pendientes (para futuras implementaciones)
      const pendingAppointments = await prisma.appointment.count({
        where: { status: 'PENDING' }
      });

      // Reseñas recientes (últimas 5 no leídas)
      const recentReviews = await prisma.review.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          clientName: true,
          rating: true,
          createdAt: true,
          isApproved: true
        }
      });

      res.json({
        counts: {
          unreadReviews,
          pendingReviews,
          pendingAppointments
        },
        recentItems: {
          reviews: recentReviews
        }
      });
    } catch (error) {
      console.error('Error al obtener notificaciones del dashboard:', error);
      res.status(500).json({ 
        message: 'Error al obtener las notificaciones',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  },

  /**
   * Marca todas las notificaciones de un tipo como leídas
   */
  markAllAsRead: async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;

      if (type === 'reviews') {
        await prisma.review.updateMany({
          where: { isRead: false },
          data: { isRead: true }
        });
        res.json({ message: 'Todas las reseñas marcadas como leídas' });
      } else {
        res.status(400).json({ message: 'Tipo de notificación no válido' });
      }
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      res.status(500).json({ message: 'Error al actualizar las notificaciones' });
    }
  }
}; 