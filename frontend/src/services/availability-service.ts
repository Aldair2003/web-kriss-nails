import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Availability {
  id: string;
  date: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityData {
  date: string;
}

// ===== AVAILABILITY API =====

export async function getAvailabilities(month?: number, year?: number): Promise<Availability[]> {
  const params = new URLSearchParams();
  
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());

  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability?${params}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener la disponibilidad');
  }
  
  return await response.json();
}

export async function createAvailability(data: CreateAvailabilityData): Promise<Availability> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear la disponibilidad');
  }
  
  return await response.json();
}

export async function updateAvailability(id: string, data: Partial<Availability>): Promise<Availability> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar la disponibilidad');
  }
  
  return await response.json();
}

export async function deleteAvailability(date: string): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/availability/admin/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cerrar la fecha');
  }
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
