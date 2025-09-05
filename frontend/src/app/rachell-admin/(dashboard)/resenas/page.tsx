'use client'

import { useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { useReviews } from './hooks/useReviews';
import { ReviewList } from './components/ReviewList';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

export default function ReviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const {
    reviews,
    isLoading,
    error,
    fetchReviews,
    deleteReview: deleteReviewOriginal,
    approveReview: approveReviewOriginal,
    replyToReview: replyToReviewOriginal,
    markAsRead: markAsReadOriginal,
    markAllAsRead,
  } = useReviews();

  // Wrapper functions para convertir Promise<Review> a Promise<void>
  const handleDeleteReview = async (id: string): Promise<void> => {
    try {
      await deleteReviewOriginal(id);
      toast({
        title: '¡Éxito!',
        description: 'Reseña eliminada correctamente',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar la reseña',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const handleApproveReview = async (id: string, data?: { 
    adminReply?: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }): Promise<void> => {
    try {
      await approveReviewOriginal(id, data);
      toast({
        title: '¡Éxito!',
        description: 'Reseña aprobada correctamente',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al aprobar la reseña',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const handleReplyToReview = async (id: string, data: { 
    adminReply: string;
    sendNotification: boolean;
    clientEmail?: string;
  }): Promise<void> => {
    try {
      await replyToReviewOriginal(id, data);
      toast({
        title: '¡Éxito!',
        description: 'Respuesta enviada correctamente',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al enviar la respuesta',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const handleMarkAsRead = async (id: string): Promise<void> => {
    try {
      await markAsReadOriginal(id);
      toast({
        title: '¡Éxito!',
        description: 'Reseña marcada como leída',
        variant: 'success',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al marcar como leída',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: '¡Éxito!',
        description: 'Todas las reseñas marcadas como leídas',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al marcar todas como leídas',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/rachell-admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [fetchReviews, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <StarIcon className="w-7 h-7 text-pink-500" />
            Reseñas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las reseñas de tus clientes
          </p>
        </div>
        <button
          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          onClick={handleMarkAllAsRead}
          disabled={isLoading}
        >
          Marcar todas como leídas
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          Error al cargar reseñas: {error.message}
        </div>
      )}

      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        onDelete={handleDeleteReview}
        onApprove={handleApproveReview}
        onReply={handleReplyToReview}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
} 