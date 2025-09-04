import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration?: number;
  isActive?: boolean;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Obtiene todos los servicios
 */
export async function getServices(): Promise<Service[]> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/services`);

    if (!response.ok) {
      console.error('Error en la respuesta del API de servicios:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Verificar si la respuesta tiene la estructura esperada (objeto con propiedad 'services')
    if (data && typeof data === 'object' && Array.isArray(data.services)) {
      return data.services;
    }
    
    // Verificar si la respuesta es un array directamente
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si llegamos aquí, la respuesta no tiene el formato esperado
    console.error('La respuesta del API no tiene el formato esperado:', data);
    return [];
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return [];
  }
}

/**
 * Obtiene servicios activos para el dropdown de reseñas
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    const allServices = await getServices();
    // Filtrar solo servicios activos
    return allServices.filter(service => service.isActive !== false);
  } catch (error) {
    console.error('Error al obtener servicios activos:', error);
    return [];
  }
}

/**
 * Obtiene un servicio por ID
 */
export async function getServiceById(id: string): Promise<Service> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/services/${id}`);

  if (!response.ok) {
    throw new Error('Error al obtener servicio');
  }

  return response.json();
} 