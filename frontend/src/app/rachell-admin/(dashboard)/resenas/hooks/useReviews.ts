import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  getAllReviews,
  deleteReview, 
  approveReview, 
  replyToReview, 
  markReviewAsRead,
  markAllReviewsAsRead
} from '@/services/review-service';
import type { Review } from '@/services/review-service';

interface UseReviewsReturn {
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
  fetchReviews: () => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  approveReview: (id: string, data?: { 
    adminReply?: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }) => Promise<Review>;
  replyToReview: (id: string, data: {
    adminReply: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }) => Promise<Review>;
  markAsRead: (id: string) => Promise<Review>;
  markAllAsRead: () => Promise<void>;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancelar peticiones pendientes al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      // Cancelar la petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo controlador para esta petición
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      setError(null);

      const data = await getAllReviews();
      setReviews(data);
    } catch (error) {
      // Ignorar errores de abort
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error('Error al obtener reseñas:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido'));
    } finally {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      setIsLoading(false);
    }
  }, []);

  const handleDeleteReview = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await deleteReview(id);
      setReviews(reviews => reviews.filter(review => review.id !== id));
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApproveReview = useCallback(async (
    id: string, 
    data?: { 
      adminReply?: string;
      sendNotification?: boolean;
      clientEmail?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedReview = await approveReview(id, data);
      
      setReviews(reviews => reviews.map(review => 
        review.id === id ? updatedReview : review
      ));
      
      return updatedReview;
    } catch (error) {
      console.error('Error al aprobar reseña:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReplyToReview = useCallback(async (
    id: string,
    data: {
      adminReply: string;
      sendNotification?: boolean;
      clientEmail?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedReview = await replyToReview(id, data);
      
      setReviews(reviews => reviews.map(review => 
        review.id === id ? updatedReview : review
      ));
      
      return updatedReview;
    } catch (error) {
      console.error('Error al responder reseña:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedReview = await markReviewAsRead(id);
      
      setReviews(reviews => reviews.map(review => 
        review.id === id ? updatedReview : review
      ));
      
      return updatedReview;
    } catch (error) {
      console.error('Error al marcar reseña como leída:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await markAllReviewsAsRead();
      
      // Actualizar todas las reseñas como leídas
      setReviews(reviews => reviews.map(review => ({
        ...review,
        isRead: true
      })));
    } catch (error) {
      console.error('Error al marcar todas las reseñas como leídas:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reviews,
    isLoading,
    error,
    fetchReviews,
    deleteReview: handleDeleteReview,
    approveReview: handleApproveReview,
    replyToReview: handleReplyToReview,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
} 