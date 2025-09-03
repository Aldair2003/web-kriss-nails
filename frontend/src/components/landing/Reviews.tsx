'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getApprovedReviews, createReview } from '@/services/review-service';
import { getActiveServices } from '@/services/service-service';

// Tipos de datos basados en la API
interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminReply?: string;
  service?: {
    id: string;
    name: string;
  };
  isApproved: boolean;
}

interface Service {
  id: string;
  name: string;
}

export function Reviews() {
  // Estado para datos reales
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState<{
    clientName?: string;
    clientEmail?: string;
    rating: number;
    comment?: string;
    serviceId?: string;
  }>({
    rating: 5
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingReviews(true);
        
        // Cargar reseñas y servicios en paralelo
        const [reviewsData, servicesData] = await Promise.all([
          getApprovedReviews(),
          getActiveServices()
        ]);
        
        setReviews(reviewsData);
        setServices(servicesData);
        
        // Configurar servicio por defecto si hay servicios disponibles
        if (servicesData.length > 0) {
          setNewReview(prev => ({
            ...prev,
            serviceId: servicesData[0].id
          }));
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar las reseñas');
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadData();
  }, []);

  // Función para enviar la reseña
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.clientName || !newReview.comment) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    console.log('🚀 Iniciando envío de reseña:', newReview);
    setIsSubmitting(true);
    
    try {
      console.log('📤 Llamando a createReview...');
      const result = await createReview({
        clientName: newReview.clientName,
        rating: newReview.rating,
        comment: newReview.comment,
        clientEmail: newReview.clientEmail,
        serviceId: newReview.serviceId
      });
      
      console.log('✅ Reseña creada exitosamente:', result);

      toast.success('¡Gracias por tu reseña! Será revisada y publicada pronto.');
      setIsModalOpen(false);
      setNewReview({ 
        rating: 5,
        serviceId: services.length > 0 ? services[0].id : undefined
      });
    } catch (error) {
      console.error('❌ Error al crear reseña:', error);
      toast.error('Hubo un error al enviar tu reseña. Por favor intenta de nuevo.');
    } finally {
      console.log('🏁 Finalizando handleSubmit');
      setIsSubmitting(false);
    }
  };

  // Función para renderizar estrellas
  const StarRating = ({ rating, interactive = false }: { rating: number; interactive?: boolean }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setNewReview({ ...newReview, rating: star })}
            className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`w-6 h-6 ${
                star <= (interactive ? newReview.rating || 5 : rating)
                  ? 'text-yellow-400 fill-yellow-400 animate-twinkle'
                  : 'text-gray-300 fill-gray-300'
              }`}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  // Función para navegar el carrusel
  const navigate = (direction: 'prev' | 'next') => {
    setCurrentIndex((current) => {
      if (direction === 'next') {
        return current === reviews.length - 1 ? 0 : current + 1;
      }
      return current === 0 ? reviews.length - 1 : current - 1;
    });
  };

  return (
    <section id="reseñas" className="py-16 relative overflow-hidden bg-pink-50/70">
      {/* Fondo decorativo mejorado */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-pink-100/30 to-transparent rounded-full blur-3xl transform -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-pink-100/30 to-transparent rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4" />
      </div>

      <Container className="relative">
        {/* Encabezado mejorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-pink-400 bg-clip-text text-transparent inline-block mb-4">
            Opiniones de Clientes
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubre lo que dicen nuestras clientas sobre su experiencia y comparte la tuya
          </p>
        </motion.div>

        {/* Carrusel de reseñas mejorado */}
        <div className="relative max-w-4xl mx-auto">
          {/* Controles de navegación mejorados */}
          <button
            onClick={() => navigate('prev')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 md:-translate-x-12 bg-white/90 text-pink-600 p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all z-10 hover:bg-pink-50 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigate('next')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 md:translate-x-12 bg-white/90 text-pink-600 p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all z-10 hover:bg-pink-50 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Card de reseña mejorada */}
          <div className="relative h-[180px] sm:h-[220px] md:h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2.5 sm:p-4 md:p-6 shadow-[0_20px_50px_rgba(219,39,119,0.1)] hover:shadow-[0_20px_50px_rgba(219,39,119,0.15)] transition-all duration-500 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2 md:mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 md:mb-2">
                        {reviews[currentIndex]?.clientName || 'Cliente'}
                      </h3>
                      <StarRating rating={reviews[currentIndex]?.rating || 5} />
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 block mb-0.5 sm:mb-1 md:mb-2">
                        {reviews[currentIndex] ? new Date(reviews[currentIndex].createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : ''}
                      </span>
                      {reviews[currentIndex]?.service && (
                        <span className="inline-block px-1.5 sm:px-2 md:px-3 py-0.5 bg-gradient-to-r from-pink-500/10 to-pink-600/10 text-pink-600 rounded-full text-[8px] sm:text-[10px] md:text-xs font-medium border border-pink-100">
                          {reviews[currentIndex].service.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 flex-grow text-xs sm:text-sm md:text-base leading-relaxed italic">
                    "{reviews[currentIndex]?.comment || 'Cargando comentario...'}"
                  </p>
                  
                  {/* Respuesta del administrador */}
                  {reviews[currentIndex]?.adminReply && (
                    <div className="mt-4 pt-4 border-t border-pink-100">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs sm:text-sm font-medium text-pink-600 mb-1">Respuesta de Rachell:</p>
                          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed bg-pink-50 p-2 sm:p-3 rounded-lg border border-pink-100">
                            {reviews[currentIndex].adminReply}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicadores mejorados */}
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-500 ${
                  index === currentIndex
                    ? 'w-8 bg-gradient-to-r from-pink-500 to-pink-600'
                    : 'w-2 bg-pink-200 hover:bg-pink-300'
                } h-2 rounded-full`}
              />
            ))}
          </div>
        </div>

        {/* Botón para dejar reseña mejorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12"
        >
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 sm:px-12 py-3 sm:py-5 text-base sm:text-lg rounded-full font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(219,39,119,0.15)] hover:shadow-[0_15px_30px_rgba(219,39,119,0.25)]"
          >
            Dejar una Reseña
          </Button>
        </motion.div>

        {/* Modal mejorado */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Comparte tu Experiencia
                  </h3>
                  {!isSubmitting && (
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tu Nombre
                    </label>
                    <input
                      type="text"
                      value={newReview.clientName || ''}
                      onChange={(e) => setNewReview({ ...newReview, clientName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 bg-white"
                      placeholder="Nombre completo"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calificación
                    </label>
                    <StarRating rating={newReview.rating || 5} interactive={!isSubmitting} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servicio Recibido
                    </label>
                    <select
                      value={newReview.serviceId || ''}
                      onChange={(e) => setNewReview({ ...newReview, serviceId: e.target.value || undefined })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-gray-800 bg-white"
                      disabled={isSubmitting}
                    >
                      <option value="">Selecciona un servicio (opcional)</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tu Comentario
                    </label>
                    <textarea
                      value={newReview.comment || ''}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all h-32 resize-none text-gray-800 placeholder-gray-400 bg-white"
                      placeholder="Cuéntanos tu experiencia..."
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    {!isSubmitting && (
                                          <Button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all hover:border-gray-300"
                    >
                      Cancelar
                    </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}
