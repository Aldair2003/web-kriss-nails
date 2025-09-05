import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');

export interface PublicHour {
  id: string;
  availabilityId: string;
  hour: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicHourWithAvailability extends PublicHour {
  availability: {
    id: string;
    date: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreatePublicHourData {
  availabilityId: string;
  hour: string;
  isAvailable?: boolean;
}

export interface UpdatePublicHourData {
  hour?: string;
  isAvailable?: boolean;
}

export interface CreateMultiplePublicHoursData {
  date: string;
  hours: string[];
}

// ===== PUBLIC HOURS API =====

/**
 * Crear un horario público
 */
export async function createPublicHour(data: CreatePublicHourData): Promise<PublicHour> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear el horario público');
  }
  
  return await response.json();
}

/**
 * Obtener horarios públicos de una fecha específica
 */
export async function getPublicHoursByDate(date: string): Promise<PublicHourWithAvailability[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours/date/${date}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los horarios públicos');
  }
  
  return await response.json();
}

/**
 * Obtener horarios públicos de un rango de fechas
 */
export async function getPublicHoursByDateRange(startDate: string, endDate: string): Promise<PublicHourWithAvailability[]> {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours/range?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los horarios públicos por rango');
  }
  
  return await response.json();
}

/**
 * Obtener horarios públicos agrupados por fecha
 */
export async function getPublicHoursGroupedByDate(startDate: string, endDate: string): Promise<Record<string, string[]>> {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours/grouped?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los horarios agrupados');
  }
  
  return await response.json();
}

/**
 * Actualizar un horario público
 */
export async function updatePublicHour(id: string, data: UpdatePublicHourData): Promise<PublicHour> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar el horario público');
  }
  
  return await response.json();
}

/**
 * Eliminar un horario público
 */
export async function deletePublicHour(id: string): Promise<{ message: string; deleted: boolean }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar el horario público');
  }
  
  return await response.json();
}

/**
 * Crear múltiples horarios públicos para una fecha
 */
export async function createMultiplePublicHours(data: CreateMultiplePublicHoursData): Promise<{ message: string; publicHours: PublicHour[] }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/public-hours/multiple`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear múltiples horarios públicos');
  }
  
  return await response.json();
}

/**
 * Verificar si una fecha y hora específica está disponible para el público
 */
export async function checkPublicHourAvailability(date: string, hour: string): Promise<{ date: string; hour: string; isAvailable: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/public-hours/check/${date}/${hour}`);
  
  if (!response.ok) {
    throw new Error('Error al verificar la disponibilidad del horario');
  }
  
  return await response.json();
}

/**
 * Obtener horarios públicos disponibles para el cliente (sin autenticación)
 */
export async function getPublicHoursForClient(startDate: string, endDate: string): Promise<Record<string, string[]>> {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  
  const response = await fetch(`${API_BASE_URL}/api/public-hours/client/grouped?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los horarios públicos para cliente');
  }
  
  return await response.json();
}

/**
 * Obtener horarios públicos de una fecha específica para el cliente
 */
export async function getPublicHoursByDateForClient(date: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/public-hours/client/date/${date}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener los horarios públicos para cliente');
  }
  
  return await response.json();
}

/**
 * Verificar si una fecha y hora específica está disponible para el cliente
 */
export async function checkPublicHourAvailabilityForClient(date: string, hour: string): Promise<{ date: string; hour: string; isAvailable: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/public-hours/client/check/${date}/${hour}`);
  
  if (!response.ok) {
    throw new Error('Error al verificar la disponibilidad del horario para cliente');
  }
  
  return await response.json();
}
