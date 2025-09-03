import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');

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
  console.log('🔍 DEBUG getAppointments - Iniciando con filtros:', filters);
  console.log('🔍 DEBUG getAppointments - API_BASE_URL:', API_BASE_URL);
  
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.date) params.append('date', filters.date);
  if (filters.clientName) params.append('clientName', filters.clientName);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  // ✅ Agregar timestamp para evitar cache
  params.append('t', Date.now().toString());

  const url = `${API_BASE_URL}/api/appointments?${params}`;
  console.log('🔍 DEBUG getAppointments - URL de la petición:', url);

  try {
    console.log('🔍 DEBUG getAppointments - Llamando a authenticatedFetch...');
    const response = await authenticatedFetch(url);
    console.log('🔍 DEBUG getAppointments - Respuesta recibida:', response);
    console.log('🔍 DEBUG getAppointments - Status:', response.status);
    console.log('🔍 DEBUG getAppointments - OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR getAppointments - Response no OK:', errorText);
      throw new Error('Error al obtener las citas');
    }
    
    const data = await response.json();
    console.log('🔍 DEBUG getAppointments - Datos parseados:', data);
    return data;
  } catch (error) {
    console.error('❌ ERROR getAppointments - Error en la petición:', error);
    throw error;
  }
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
  
  const result = await response.json();
  
  // El backend devuelve { message, data } pero necesitamos solo data
  return result.data || result;
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

// Nueva función para obtener slots disponibles del nuevo endpoint
export async function getAvailableAppointmentSlots(startDate: string, endDate: string, serviceId?: string): Promise<{
  slots: Array<{
    date: string;
    time: string;
    available: boolean;
    appointmentId?: string;
    status?: string;
    conflictReason?: string;
  }>;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  serviceDuration: number;
}> {
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...(serviceId && { serviceId })
  });
  
  const response = await fetch(`${API_BASE_URL}/api/appointments/available-slots?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los slots disponibles');
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

export function formatAppointmentForCalendar(appointment: Appointment | any) {
  console.log('🔍 DEBUG formatAppointmentForCalendar:');
  console.log('  - Cita completa:', appointment);
  
  // Manejar tanto Appointment directo como respuesta del backend
  let actualAppointment: Appointment;
  
  if (appointment.data && appointment.message) {
    // Es una respuesta del backend: { message: '...', data: { ... } }
    console.log('🔍 DEBUG - Detectada respuesta del backend, usando appointment.data');
    actualAppointment = appointment.data;
  } else {
    // Es un Appointment directo
    console.log('🔍 DEBUG - Appointment directo detectado');
    actualAppointment = appointment;
  }
  
  console.log('  - Appointment real a procesar:', actualAppointment);
  console.log('  - Fecha original del backend:', actualAppointment.date);
  console.log('  - Tipo de fecha:', typeof actualAppointment.date);
  console.log('  - Longitud de la fecha:', actualAppointment.date?.length);
  console.log('  - Fecha como JSON:', JSON.stringify(actualAppointment.date));
  
  // Validar que la fecha sea válida antes de procesarla
  if (!actualAppointment.date || actualAppointment.date === 'null' || actualAppointment.date === 'undefined') {
    console.error('❌ ERROR formatAppointmentForCalendar - Fecha inválida:', actualAppointment.date);
    throw new Error(`Fecha inválida: ${actualAppointment.date}`);
  }
  
  const appointmentDate = new Date(actualAppointment.date);
  console.log('  - Fecha después de new Date():', appointmentDate);
  
  // Verificar si la fecha es válida antes de llamar a toISOString
  if (isNaN(appointmentDate.getTime())) {
    console.error('❌ ERROR formatAppointmentForCalendar - Date inválido creado de:', actualAppointment.date);
    throw new Error(`No se pudo crear una fecha válida de: ${actualAppointment.date}`);
  }
  
  console.log('  - Fecha ISO string:', appointmentDate.toISOString());
  console.log('  - Fecha local string:', appointmentDate.toString());
  console.log('  - Hora local:', appointmentDate.toLocaleTimeString());
  
  // Verificar que el servicio existe y tiene duración
  const serviceDuration = actualAppointment.service?.duration || 60; // Default 60 minutos
  const serviceName = actualAppointment.service?.name || 'Servicio no especificado';
  
  console.log('  - Duración del servicio:', serviceDuration, 'minutos');
  
  // ✅ SOLUCIÓN FULLCALENDAR: Usar fechas locales directamente
  // FullCalendar maneja automáticamente la zona horaria, no necesitamos conversiones manuales
  const startTime = new Date(appointmentDate);
  console.log('  - startTime (fecha local):', startTime.toLocaleTimeString());
  console.log('  - startTime ISO:', startTime.toISOString());
  
  // Calcular la fecha de fin basada en la duración del servicio
  const endTime = new Date(startTime.getTime() + (serviceDuration * 60000));
  console.log('  - endTime calculado:', endTime.toLocaleTimeString());
  
  const result = {
    id: actualAppointment.id,
    title: `${actualAppointment.clientName} - ${serviceName}`,
    start: startTime,
    end: endTime,
    resource: actualAppointment,
    backgroundColor: getEventColor(actualAppointment.status),
    borderColor: getBorderColor(actualAppointment.status),
  };
  
  console.log('  - Resultado final:', {
    start: result.start.toLocaleTimeString(),
    end: result.end.toLocaleTimeString(),
    startISO: result.start.toISOString(),
    endISO: result.end.toISOString(),
    startLocal: result.start.toString(),
    endLocal: result.end.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startTimezoneOffset: result.start.getTimezoneOffset(),
    endTimezoneOffset: result.end.getTimezoneOffset()
  });
  
  return result;
}

export function getEventColor(status: Appointment['status']): string {
  switch (status) {
    case 'PENDING':
      return '#f59e0b'; // Yellow - más vibrante
    case 'CONFIRMED':
      return '#10b981'; // Green - más vibrante
    case 'COMPLETED':
      return '#3b82f6'; // Blue - más vibrante
    case 'CANCELLED':
      return '#ef4444'; // Red - más vibrante
    default:
      return '#ec4899'; // Pink por defecto (color principal del proyecto)
  }
}

export function getBorderColor(status: Appointment['status']): string {
  switch (status) {
    case 'PENDING':
      return '#d97706'; // Darker yellow
    case 'CONFIRMED':
      return '#059669'; // Darker green
    case 'COMPLETED':
      return '#2563eb'; // Darker blue
    case 'CANCELLED':
      return '#dc2626'; // Darker red
    default:
      return '#be185d'; // Darker pink
  }
}
