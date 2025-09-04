import { authenticatedFetch } from '@/lib/auth';
import { getAppointments } from './appointment-service';
import { getAllReviews } from './review-service';
import { getImages } from './image-service';
import { getActiveServices } from './service-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');

export interface DashboardStats {
  citasHoy: number;
  citasConfirmadas: number;
  citasPendientes: number;
  servicios: number;
  resenas: number;
  resenasPendientes: number;
  resenasNoLeidas: number;
  fotos: number;
  ingresosMes: number;
  citasCompletadasMes: number;
  promedioPorCita: number;
  clientesNuevosMes: number;
  clientesRecurrentesMes: number;
}

export interface TopPerformer {
  servicio: string;
  citas: number;
  ingresos: number;
}

export interface DashboardData {
  stats: DashboardStats;
  proximasCitas: any[];
  topPerformers: TopPerformer[];
}

/**
 * Obtiene todas las estadísticas del dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Cargar todos los datos en paralelo
    const [appointmentsData, allReviews, allImages, servicesData] = await Promise.all([
      getAppointments({ limit: 1000 }), // Obtener más citas para análisis
      getAllReviews(),
      getImages({ isActive: true }),
      getActiveServices()
    ]);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Procesar citas del día
    const citasHoy = appointmentsData.appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getDate() === today.getDate() &&
             aptDate.getMonth() === currentMonth &&
             aptDate.getFullYear() === currentYear;
    });

    const citasConfirmadas = citasHoy.filter(apt => apt.status === 'CONFIRMED').length;
    const citasPendientes = citasHoy.filter(apt => apt.status === 'PENDING').length;

    // Procesar citas del mes
    const citasDelMes = appointmentsData.appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getMonth() === currentMonth &&
             aptDate.getFullYear() === currentYear;
    });

    const citasCompletadasMes = citasDelMes.filter(apt => apt.status === 'COMPLETED');
    const ingresosMes = citasCompletadasMes.reduce((total, apt) => 
      total + Number(apt.service.price), 0
    );

    // Calcular promedio por cita
    const promedioPorCita = citasCompletadasMes.length > 0 
      ? ingresosMes / citasCompletadasMes.length 
      : 0;

    // Calcular clientes nuevos vs recurrentes (simplificado)
    const clientesDelMes = new Set(citasDelMes.map(apt => apt.clientName));
    const clientesNuevosMes = clientesDelMes.size; // Simplificado
    const clientesRecurrentesMes = citasDelMes.length - clientesNuevosMes;

    return {
      citasHoy: citasHoy.length,
      citasConfirmadas,
      citasPendientes,
      servicios: servicesData.length,
      resenas: allReviews.length,
      resenasPendientes: 0, // Se calcula por separado
      resenasNoLeidas: 0, // Se calcula por separado
      fotos: allImages.length,
      ingresosMes,
      citasCompletadasMes: citasCompletadasMes.length,
      promedioPorCita,
      clientesNuevosMes,
      clientesRecurrentesMes
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    throw error;
  }
}

/**
 * Obtiene los servicios más populares
 */
export async function getTopPerformers(): Promise<TopPerformer[]> {
  try {
    const appointmentsData = await getAppointments({ limit: 1000 });
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filtrar citas del mes actual
    const citasDelMes = appointmentsData.appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getMonth() === currentMonth &&
             aptDate.getFullYear() === currentYear;
    });

    // Agrupar por servicio
    const serviciosMap = new Map<string, { citas: number; ingresos: number }>();

    citasDelMes.forEach(apt => {
      const servicioName = apt.service.name;
      const precio = Number(apt.service.price);
      
      if (serviciosMap.has(servicioName)) {
        const current = serviciosMap.get(servicioName)!;
        serviciosMap.set(servicioName, {
          citas: current.citas + 1,
          ingresos: current.ingresos + precio
        });
      } else {
        serviciosMap.set(servicioName, {
          citas: 1,
          ingresos: precio
        });
      }
    });

    // Convertir a array y ordenar por citas
    const topPerformers = Array.from(serviciosMap.entries())
      .map(([servicio, data]) => ({
        servicio,
        citas: data.citas,
        ingresos: data.ingresos
      }))
      .sort((a, b) => b.citas - a.citas)
      .slice(0, 5); // Top 5

    return topPerformers;
  } catch (error) {
    console.error('Error obteniendo top performers:', error);
    return [];
  }
}
