import { API_URL } from '@/config';
import { authenticatedFetch } from '@/lib/auth';

export interface ServiceCategory {
  id: string;
  name: string;
  order?: number;
  servicesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Obtiene todas las categorías de servicio
 */
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/service-categories`);

    if (!response.ok) {
      console.error('Error al obtener categorías de servicio:', response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener categorías de servicio:', error);
    return [];
  }
}

/**
 * Crea una nueva categoría de servicio
 */
export async function createServiceCategory(name: string): Promise<ServiceCategory> {
  const response = await authenticatedFetch(`${API_URL}/api/service-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error al crear categoría:', errorData);
    throw new Error(errorData.message || 'Error al crear la categoría de servicio');
  }

  return response.json();
}

/**
 * Elimina una categoría de servicio
 */
export async function deleteServiceCategory(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/service-categories/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error al eliminar categoría:', errorData);
    throw new Error(errorData.message || 'Error al eliminar la categoría de servicio');
  }
} 