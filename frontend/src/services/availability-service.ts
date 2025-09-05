import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');

export interface Availability {
  id: string;
  date: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityData {
  date: string;
  isAvailable?: boolean;
}

export interface DateRangeData {
  startDate: string;
  endDate: string;
}

// ===== AVAILABILITY API =====

export async function getAvailabilities(month?: number, year?: number): Promise<Availability[]> {
  try {
    // Usar el endpoint /dates que sí acepta month y year
    const params = new URLSearchParams();
    
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    console.log('🔍 getAvailabilities llamando a:', `${API_BASE_URL}/api/availability/dates?${params}`);
    
    const response = await fetch(`${API_BASE_URL}/api/availability/dates?${params}`);
    
    if (!response.ok) {
      console.error('❌ Error response:', response.status, response.statusText);
      throw new Error('Error al obtener la disponibilidad');
    }
    
    const dates = await response.json();
    console.log('✅ getAvailabilities recibió fechas:', dates);
    
    // Convertir las fechas a objetos Availability
    const availabilities: Availability[] = dates.map((dateStr: string) => ({
      id: `temp-${dateStr}`,
      date: dateStr,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    return availabilities;
  } catch (error) {
    console.error('❌ Error en getAvailabilities:', error);
    throw error;
  }
}

/**
 * Habilitar un día específico para trabajo
 */
export async function enableDate(date: string): Promise<Availability> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin/enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al habilitar el día');
  }
  
  return await response.json();
}

/**
 * Deshabilitar un día específico para trabajo
 */
export async function disableDate(date: string): Promise<Availability> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin/disable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al deshabilitar el día');
  }
  
  return await response.json();
}

/**
 * Habilitar un rango de días para trabajo
 */
export async function enableDateRange(data: DateRangeData): Promise<{ message: string; enabledDates: Availability[] }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin/enable-range`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al habilitar el rango de días');
  }
  
  return await response.json();
}

/**
 * Obtener fechas disponibles para un mes específico
 */
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

/**
 * Eliminar completamente un día del sistema
 */
export async function removeDate(date: string): Promise<{ message: string; removed: boolean }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar el día');
  }
  
  return await response.json();
}
