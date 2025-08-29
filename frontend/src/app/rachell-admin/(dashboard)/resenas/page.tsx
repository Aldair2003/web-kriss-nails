'use client'

import { useEffect } from 'react';
import { useReviews } from './hooks/useReviews';
import { ReviewList } from './components/ReviewList';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ReviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    reviews,
    isLoading,
    error,
    fetchReviews,
    deleteReview,
    approveReview,
    replyToReview,
    markAsRead,
    markAllAsRead,
  } = useReviews();

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
          <h1 className="text-2xl font-semibold text-gray-900">
            Reseñas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las reseñas de tus clientes
          </p>
        </div>
        <button
          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          onClick={markAllAsRead}
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
        onDelete={deleteReview}
        onApprove={approveReview}
        onReply={replyToReview}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
} 