import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckIcon, 
  EyeIcon, 
  ChatBubbleLeftIcon,
  StarIcon, 
  TrashIcon,
  HeartIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/solid';
import type { Review } from '@/services/review-service';
import { ReviewFilters } from './ReviewFilters';
import type { ReviewFilters as ReviewFiltersType } from './ReviewFilters';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onApprove: (id: string, data?: { 
    adminReply?: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }) => Promise<void>;
  onReply: (id: string, data: { 
    adminReply: string;
    sendNotification: boolean;
    clientEmail?: string;
  }) => Promise<void>;
  onMarkAsRead: (id: string) => Promise<void>;
}

export function ReviewList({
  reviews,
  isLoading,
  onDelete,
  onApprove,
  onReply,
  onMarkAsRead,
}: ReviewListProps) {
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  useEffect(() => {
    setFilteredReviews(reviews);
  }, [reviews]);

  const handleFilter = (filters: ReviewFiltersType) => {
    let filtered = [...reviews];

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.clientName.toLowerCase().includes(searchTerm) ||
          review.comment.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de estado de aprobación
    if (filters.status !== 'all') {
      filtered = filtered.filter(
        (review) =>
          (filters.status === 'approved' && review.isApproved) ||
          (filters.status === 'pending' && !review.isApproved)
      );
    }

    // Filtro de estado de lectura
    if (filters.readStatus !== 'all') {
      filtered = filtered.filter(
        (review) =>
          (filters.readStatus === 'read' && review.isRead) ||
          (filters.readStatus === 'unread' && !review.isRead)
      );
    }

    setFilteredReviews(filtered);
  };

  const openReplyDialog = (review: Review) => {
    setSelectedReview(review);
    // Pre-cargar la respuesta si ya existe
    setReplyText(review.adminReply || '');
    setSendNotification(true);
  };

  const handleReply = async () => {
    if (!selectedReview) return;

    try {
      await onReply(selectedReview.id, {
        adminReply: replyText,
        sendNotification,
        clientEmail: selectedReview.clientEmail,
      });

      // Limpiar el estado
      setReplyText('');
      setSelectedReview(null);
    } catch (error) {
      console.error('Error al responder reseña:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await onApprove(id, {
        sendNotification: true,
        clientEmail: reviews.find(r => r.id === id)?.clientEmail,
      });
    } catch (error) {
      console.error('Error al aprobar reseña:', error);
    }
  };

  const handleDelete = (id: string) => {
    setReviewToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    
    try {
      await onDelete(reviewToDelete);
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
    } finally {
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await onMarkAsRead(id);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            className={`h-4 w-4 ${
              index < rating 
                ? 'text-pink-500 fill-pink-500' 
                : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (review: Review) => {
    if (review.isApproved) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Aprobada
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
        <ClockIcon className="w-3 h-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const getReadBadge = (isRead: boolean) => {
    if (isRead) {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          <EyeIcon className="w-3 h-3 mr-1" />
          Leída
        </Badge>
      );
    }
    return (
      <Badge className="bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100">
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        Nueva
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-pink-800">{reviews.length}</p>
              </div>
              <HeartIcon className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Aprobadas</p>
                <p className="text-2xl font-bold text-green-800">
                  {reviews.filter(r => r.isApproved).length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {reviews.filter(r => !r.isApproved).length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">No leídas</p>
                <p className="text-2xl font-bold text-blue-800">
                  {reviews.filter(r => !r.isRead).length}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:flex gap-6">
        <div className="lg:w-1/4 mb-6 lg:mb-0">
          <ReviewFilters onFilter={handleFilter} />
        </div>
        
        <div className="lg:w-3/4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Reseñas</h2>
            <p className="text-gray-600">Administra las reseñas de tus clientes de manera fácil e intuitiva</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reseñas</h3>
                <p className="text-gray-500">No se encontraron reseñas con los filtros aplicados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`border-l-4 hover:shadow-lg transition-all duration-200 ${
                      !review.isRead 
                        ? 'border-l-pink-500 bg-pink-50/30' 
                        : review.isApproved 
                          ? 'border-l-green-500' 
                          : 'border-l-yellow-500'
                    }`}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header de la reseña */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-5 w-5 text-gray-400" />
                                  <span className="font-semibold text-gray-900">{review.clientName}</span>
                                </div>
                                {review.clientEmail && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <EnvelopeIcon className="h-4 w-4" />
                                    <span>{review.clientEmail}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mb-3">
                                {renderStars(review.rating)}
                                <span className="text-sm text-gray-500">
                                  {format(new Date(review.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {getStatusBadge(review)}
                              {getReadBadge(review.isRead)}
                            </div>
                          </div>

                          {/* Contenido de la reseña */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 leading-relaxed italic">
                              "{review.comment}"
                            </p>
                          </div>

                          {/* Respuesta del admin si existe */}
                          {review.adminReply && (
                            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                                  <ChatBubbleLeftIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-pink-700 mb-1">Tu respuesta:</p>
                                  <p className="text-gray-700">{review.adminReply}</p>
                                  {review.replyDate && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      Respondido el {format(new Date(review.replyDate), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Acciones */}
                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            {!review.isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(review.id)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Marcar como leída
                              </Button>
                            )}
                            
                            {!review.isApproved && (
                              <Button
                                size="sm"
                                onClick={() => handleApprove(review.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReplyDialog(review)}
                              className="text-pink-600 border-pink-200 hover:bg-pink-50"
                            >
                              <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                              {review.adminReply ? 'Editar respuesta' : 'Responder'}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(review.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Dialog para responder reseñas */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {selectedReview?.adminReply ? 'Editar respuesta' : 'Responder a reseña'}
            </DialogTitle>
            <DialogDescription>
              Responde a {selectedReview?.clientName} de manera personal y profesional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply">Tu respuesta</Label>
              <Textarea
                id="reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta cordial y profesional..."
                className="min-h-[100px] focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            {selectedReview?.clientEmail && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notification"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="notification" className="text-sm text-gray-700">
                  Enviar notificación por email
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={handleReply}
              className="bg-pink-600 hover:bg-pink-700 text-white focus:ring-pink-500"
            >
              {selectedReview?.adminReply ? 'Actualizar' : 'Enviar respuesta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setReviewToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Reseña"
        message="¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};