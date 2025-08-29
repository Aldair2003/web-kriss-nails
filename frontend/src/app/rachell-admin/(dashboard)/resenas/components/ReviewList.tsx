import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  CheckIcon, 
  EyeIcon, 
  ChatBubbleLeftIcon,
  StarIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import type { Review } from '@/services/review-service';
import { ReviewFilters } from './ReviewFilters';
import type { ReviewFilters as ReviewFiltersType } from './ReviewFilters';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onApprove: (id: string, data?: { 
    adminReply?: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }) => Promise<Review>;
  onReply: (id: string, data: {
    adminReply: string;
    sendNotification?: boolean;
    clientEmail?: string;
  }) => Promise<Review>;
  onMarkAsRead: (id: string) => Promise<Review>;
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

  // Actualizar los reviews filtrados cuando cambian los reviews
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

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta reseña?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error al eliminar reseña:', error);
      }
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
      <div className="flex">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            className={`h-4 w-4 ${
              index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="lg:flex gap-6">
        <div className="lg:w-1/4 mb-6 lg:mb-0">
          <ReviewFilters onFilter={handleFilter} />
        </div>
        
        <div className="lg:w-3/4">
          <Card>
            <CardHeader>
              <CardTitle>Reseñas</CardTitle>
              <CardDescription>
                Gestiona las reseñas de tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Cargando reseñas...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No se encontraron reseñas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Estado</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Calificación</TableHead>
                      <TableHead>Comentario</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id} className={!review.isRead ? 'bg-slate-50' : ''}>
                        <TableCell>
                          {review.isApproved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Aprobada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{review.clientName}</div>
                          {review.clientEmail && (
                            <div className="text-xs text-muted-foreground">
                              {review.clientEmail}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{review.comment}</div>
                          {review.adminReply && (
                            <div className="mt-1 text-xs italic text-muted-foreground truncate">
                              Respuesta: {review.adminReply}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {review.createdAt && format(new Date(review.createdAt), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!review.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsRead(review.id)}
                                title="Marcar como leída"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {!review.isApproved && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(review.id)}
                                title="Aprobar"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openReplyDialog(review)}
                                  title="Responder"
                                >
                                  <ChatBubbleLeftIcon className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Responder a reseña</DialogTitle>
                                  <DialogDescription>
                                    Escribe una respuesta a la reseña de {selectedReview?.clientName}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="py-4">
                                  <div className="mb-4 p-3 bg-slate-50 rounded-md">
                                    <p className="font-medium mb-1">Reseña original:</p>
                                    <div className="mb-2">{renderStars(selectedReview?.rating || 0)}</div>
                                    <p className="text-sm">{selectedReview?.comment}</p>
                                  </div>
                                  
                                  <div className="grid w-full gap-2">
                                    <Label htmlFor="reply">Tu respuesta</Label>
                                    <Textarea
                                      id="reply"
                                      placeholder="Escribe tu respuesta..."
                                      value={replyText}
                                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 mt-4">
                                    <Checkbox
                                      id="sendNotification"
                                      checked={sendNotification}
                                      onCheckedChange={(checked: boolean | 'indeterminate') => 
                                        setSendNotification(checked as boolean)
                                      }
                                    />
                                    <Label htmlFor="sendNotification">
                                      Notificar al cliente por email
                                    </Label>
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handleReply} disabled={!replyText.trim()}>
                                      Responder
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(review.id)}
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 