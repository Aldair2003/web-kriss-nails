'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useLandingServices } from '@/hooks/useLandingServices';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function Services() {
  const { servicesByCategory, isLoading, error, fetchServices } = useLandingServices();

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Función para formatear la duración
  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split(':');
    if (minutes === '00') return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <section id="servicios" className="py-12 md:py-16 relative overflow-hidden bg-white">
      {/* Fondo con gradiente y elementos decorativos */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-gray-100/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-gray-100/40 to-transparent rounded-full blur-3xl" />
      </div>

      <Container className="relative">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-pink-500 to-pink-400 bg-clip-text text-transparent inline-block mb-3">
            Nuestros Servicios
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Descubre nuestros servicios especialmente diseñados para ti
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <p>Hubo un error al cargar los servicios. Por favor, intenta más tarde.</p>
          </div>
        ) : (
          /* Servicios por categoría */
          <div className="space-y-12">
            {Object.entries(servicesByCategory).map(([categoryId, category], categoryIndex) => (
              <div key={categoryId} className="relative">
                {/* Título de categoría */}
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ amount: 0.3 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6"
                >
                  {category.categoryName}
                </motion.h3>

                {/* Grid de servicios */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {category.items.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ amount: 0.3 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group relative h-full"
                    >
                      {/* Card del servicio */}
                      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col max-w-sm mx-auto">
                        {/* Imagen */}
                        <div className="relative h-40 sm:h-48 overflow-hidden">
                          <Image
                            src={service.images[0]?.url || '/images/placeholder.jpg'}
                            alt={service.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                          {service.isHighlight && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-md">
                              Destacado
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="p-4 sm:p-5 flex-grow flex flex-col">
                          <div className="flex-grow">
                            <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">
                              {service.name}
                            </h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                            <div className="flex flex-col">
                              {service.hasOffer && service.offerPrice ? (
                                <>
                                  <span className="text-sm line-through text-gray-400">
                                    ${typeof service.price === 'string' ? parseFloat(service.price).toFixed(2) : service.price.toFixed(2)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-green-600">
                                      ${typeof service.offerPrice === 'string' ? parseFloat(service.offerPrice).toFixed(2) : service.offerPrice.toFixed(2)}
                                    </span>
                                    <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                      {formatDuration(service.duration)}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-pink-600">
                                    ${typeof service.price === 'string' ? parseFloat(service.price).toFixed(2) : service.price.toFixed(2)}
                                  </span>
                                  <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                    {formatDuration(service.duration)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Link href={`/agendar?serviceId=${service.id}`} className="block">
                              <Button 
                                className="bg-white border-2 border-pink-500 text-pink-600 hover:bg-pink-500 hover:text-white transition-all duration-300 rounded-full px-4 py-1.5 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transform active:scale-95"
                              >
                                Reservar
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/agendar">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-medium text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform active:scale-95 border-2 border-transparent hover:border-pink-400"
            >
              Agenda tu Cita Ahora
            </Button>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
