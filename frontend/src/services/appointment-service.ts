import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  date: string;
  serviceId: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  date?: string;
  notes?: string;
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AppointmentFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  date?: string;
  clientName?: string;
  page?: number;
  limit?: number;
}

// ===== APPOINTMENTS API =====

export async function getAppointments(filters: AppointmentFilters = {}): Promise<{
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.date) params.append('date', filters.date);
  if (filters.clientName) params.append('clientName', filters.clientName);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await authenticatedFetch(`${API_BASE_URL}/api/appointments?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener las citas');
  }
  
  return await response.json();
}

export async function getAppointment(id: string): Promise<Appointment> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/appointments/${id}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener la cita');
  }
  
  return await response.json();
}

export async function createAppointment(data: CreateAppointmentData): Promise<Appointment> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear la cita');
  }
  
  return await response.json();
}

export async function updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/appointments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar la cita');
  }
  
  return await response.json();
}

export async function deleteAppointment(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/appointments/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar la cita');
  }
}

// ===== AVAILABILITY API =====

export async function getAvailableSlots(date: string, serviceDuration: number): Promise<AvailableSlot[]> {
  const params = new URLSearchParams({
    date,
    duration: serviceDuration.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/api/availability?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los horarios disponibles');
  }
  
  return await response.json();
}

export async function getAvailableDates(month: number, year: number): Promise<string[]> {
  const params = new URLSearchParams({
    month: month.toString(),
    year: year.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/api/availability/dates?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener las fechas disponibles');
  }
  
  return await response.json();
}

// ===== UTILS =====

export function formatAppointmentForCalendar(appointment: Appointment) {
  const appointmentDate = new Date(appointment.date);
  const endDate = new Date(appointmentDate.getTime() + (appointment.service.duration * 60000)); // duration en minutos
  
  return {
    id: appointment.id,
    title: `${appointment.clientName} - ${appointment.service.name}`,
    start: appointmentDate,
    end: endDate,
    resource: appointment,
    backgroundColor: getEventColor(appointment.status),
    borderColor: getBorderColor(appointment.status),
  };
}

export function getEventColor(status: Appointment['status']): string {
  switch (status) {
    case 'PENDING':
      return '#fbbf24'; // Yellow
    case 'CONFIRMED':
      return '#10b981'; // Green
    case 'COMPLETED':
      return '#6b7280'; // Gray
    case 'CANCELLED':
      return '#ef4444'; // Red
    default:
      return '#6b7280';
  }
}

export function getBorderColor(status: Appointment['status']): string {
  switch (status) {
    case 'PENDING':
      return '#f59e0b';
    case 'CONFIRMED':
      return '#059669';
    case 'COMPLETED':
      return '#4b5563';
    case 'CANCELLED':
      return '#dc2626';
    default:
      return '#4b5563';
  }
}
