'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/container';

// Tipos de datos basados en la API
type ImageType = 'GALLERY' | 'BEFORE_AFTER' | 'SERVICE';

interface GalleryImage {
  url: string;
  type: ImageType;
  category: string;
  serviceId?: string;
}

// Datos de prueba que simulan la respuesta de la API
const mockGalleryImages: GalleryImage[] = [
  {
    url: '/images/pruebafoto.jpg',
    type: 'GALLERY',
    category: 'Acrílicas',
    serviceId: '1'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'GALLERY',
    category: 'Diseños Exclusivos'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'BEFORE_AFTER',
    category: 'Transformaciones'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'GALLERY',
    category: 'Nail Art'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'SERVICE',
    category: 'Servicios Premium',
    serviceId: '2'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'GALLERY',
    category: 'Tendencias'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'BEFORE_AFTER',
    category: 'Resultados'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'GALLERY',
    category: 'Arte Digital'
  },
  {
    url: '/images/pruebafoto.jpg',
    type: 'SERVICE',
    category: 'Servicios VIP',
    serviceId: '3'
  }
];

export function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeFilter, setActiveFilter] = useState<ImageType | 'ALL'>('ALL');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Simular llamada a la API
  useEffect(() => {
    const filteredImages = activeFilter === 'ALL' 
      ? mockGalleryImages 
      : mockGalleryImages.filter(img => {
          if (activeFilter === 'SERVICE' && activeSubcategory) {
            return img.type === activeFilter && img.category === activeSubcategory;
          }
          return img.type === activeFilter;
        });
    setImages(filteredImages);
  }, [activeFilter, activeSubcategory]);

  const filters: { label: string; value: ImageType | 'ALL'; subcategories?: string[] }[] = [
    { label: 'Todo', value: 'ALL' },
    { label: 'Galería', value: 'GALLERY' },
    { label: 'Antes/Después', value: 'BEFORE_AFTER' },
    { 
      label: 'Servicios', 
      value: 'SERVICE',
      subcategories: ['Acrílicas', 'Semipermanentes', 'Pedicure']
    }
  ];

  return (
    <section id="galeria" className="py-12 md:py-16 relative overflow-hidden bg-gray-50">
      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-gray-100/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-gray-100/50 to-transparent rounded-full blur-3xl" />
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
            Nuestro Arte
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
            Inspírate con nuestros diseños y transformaciones
          </p>

          {/* Filtros principales */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {filters.map((filter) => (
              <motion.button
                key={filter.value}
                onClick={() => {
                  setActiveFilter(filter.value);
                  setActiveSubcategory('');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter.value
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-pink-50'
                }`}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>

          {/* Subcategorías para Servicios */}
          {activeFilter === 'SERVICE' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6"
            >
              {filters.find(f => f.value === 'SERVICE')?.subcategories?.map((subcat) => (
                <motion.button
                  key={subcat}
                  onClick={() => setActiveSubcategory(subcat)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                    activeSubcategory === subcat
                      ? 'bg-pink-200 text-pink-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                  }`}
                >
                  {subcat}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Grid de Instagram */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 max-w-5xl mx-auto">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square group cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image.url}
                alt={image.category}
                fill
                className="object-cover"
              />
              
              {/* Overlay elegante */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1.5 ${
                    image.type === 'BEFORE_AFTER' ? 'bg-blue-500/90' :
                    image.type === 'SERVICE' ? 'bg-purple-500/90' :
                    'bg-pink-500/90'
                  } text-white`}>
                    {image.type === 'BEFORE_AFTER' ? '✨ Antes/Después' :
                     image.type === 'SERVICE' ? '💅 ' + image.category :
                     '🎨 Galería'}
                  </span>
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {image.category}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox mejorado */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Contenedor de imagen(es) */}
                  <div className="relative w-full md:w-2/3">
                    {selectedImage.type === 'BEFORE_AFTER' ? (
                      <div className="relative aspect-square">
                        <div className="absolute inset-0 flex">
                          {/* Imagen Antes */}
                          <div className="w-1/2 relative overflow-hidden">
                            <Image
                              src={selectedImage.url}
                              alt="Antes"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                              Antes
                            </div>
                          </div>
                          {/* Imagen Después */}
                          <div className="w-1/2 relative overflow-hidden">
                            <Image
                              src={selectedImage.url}
                              alt="Después"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-pink-500/80 text-white px-3 py-1 rounded-full text-sm">
                              Después
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-square">
                        <Image
                          src={selectedImage.url}
                          alt={selectedImage.category}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Panel de información */}
                  <div className="w-full md:w-1/3 p-6 bg-white flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedImage.category}
                      </h3>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedImage.type === 'BEFORE_AFTER' ? 'bg-blue-500 text-white' :
                          selectedImage.type === 'SERVICE' ? 'bg-purple-500 text-white' :
                          'bg-pink-500 text-white'
                        }`}>
                          {selectedImage.type === 'BEFORE_AFTER' ? '✨ Transformación' :
                           selectedImage.type === 'SERVICE' ? '💅 Servicio' :
                           '🎨 Diseño'}
                        </span>
                      </div>

                      {selectedImage.type === 'SERVICE' && (
                        <div className="mt-auto pt-4">
                          <button
                            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-full font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                          >
                            Reservar este servicio
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}
