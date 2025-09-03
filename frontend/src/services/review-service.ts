import { API_URL } from '@/config';
import { authenticatedFetch } from '@/lib/auth';

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  adminReply?: string;
  replyDate?: string;
  isRead: boolean;
  clientEmail?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtiene todas las reseñas aprobadas para mostrar en el landing page
 */
export async function getApprovedReviews(): Promise<Review[]> {
  try {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error al obtener reseñas:', response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    return [];
  }
}

/**
 * Obtiene todas las reseñas, incluyendo las no aprobadas (solo admin)
 */
export async function getAllReviews(): Promise<Review[]> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/all`);

    if (!response.ok) {
      console.error('Error al obtener todas las reseñas:', response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener todas las reseñas:', error);
    return [];
  }
}

/**
 * Obtiene conteo de reseñas no leídas
 */
export async function getUnreadReviewsCount(): Promise<number> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/unread/count`);

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error al obtener conteo de reseñas no leídas:', error);
    return 0;
  }
}

/**
 * Obtiene conteo de reseñas pendientes de aprobación
 */
export async function getPendingReviewsCount(): Promise<number> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/pending/count`);

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error al obtener conteo de reseñas pendientes:', error);
    return 0;
  }
}

/**
 * Crea una nueva reseña
 */
export async function createReview(data: {
  clientName: string;
  rating: number;
  comment: string;
  clientEmail?: string;
  serviceId?: string;
}): Promise<Review> {
  console.log('🔍 createReview - Iniciando con datos:', data);
  console.log('🔍 createReview - API_URL:', API_URL);
  
  try {
    console.log('📤 createReview - Enviando petición...');
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📥 createReview - Respuesta recibida:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ createReview - Error en respuesta:', errorData);
      throw new Error(errorData.message || 'Error al crear reseña');
    }

    const result = await response.json();
    console.log('✅ createReview - Reseña creada exitosamente:', result);
    return result;
  } catch (error) {
    console.error('❌ createReview - Error en la petición:', error);
    throw error;
  }
}

/**
 * Aprueba una reseña
 */
export async function approveReview(
  id: string, 
  data?: { 
    adminReply?: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }
): Promise<Review> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al aprobar reseña');
    }

    return response.json();
  } catch (error) {
    console.error('Error al aprobar reseña:', error);
    throw error;
  }
}

/**
 * Responde a una reseña
 */
export async function replyToReview(
  id: string,
  data: {
    adminReply: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }
): Promise<Review> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/${id}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al responder reseña');
    }

    return response.json();
  } catch (error) {
    console.error('Error al responder reseña:', error);
    throw error;
  }
}

/**
 * Marca una reseña como leída
 */
export async function markReviewAsRead(id: string): Promise<Review> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/${id}/read`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al marcar reseña como leída');
    }

    return response.json();
  } catch (error) {
    console.error('Error al marcar reseña como leída:', error);
    throw error;
  }
}

/**
 * Marca todas las reseñas como leídas
 */
export async function markAllReviewsAsRead(): Promise<void> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/notifications/mark-all-read/reviews`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al marcar todas las reseñas como leídas');
    }
  } catch (error) {
    console.error('Error al marcar todas las reseñas como leídas:', error);
    throw error;
  }
}

/**
 * Elimina una reseña
 */
export async function deleteReview(id: string): Promise<void> {
  try {
    const response = await authenticatedFetch(`${API_URL}/api/reviews/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al eliminar la reseña');
    }
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    throw error;
  }
} 