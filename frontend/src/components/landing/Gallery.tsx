'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/container';
import { API_URL } from '@/config';

// Función mejorada para transformar las URLs de Google Drive
const getGoogleDriveImageUrl = (url: string): string => {
  if (!url || !url.includes('drive.google.com')) return url;
  
  // Extraer el ID de la URL
  let fileId;
  if (url.includes('id=')) {
    const match = url.match(/id=([^&]+)/);
    if (match && match[1]) {
      fileId = match[1];
    }
  } else {
    // Intenta extraer el ID de cualquier formato de URL de Google Drive
    const match = url.match(/[-\w]{25,}/);
    if (match) {
      fileId = match[0];
    }
  }
  
  if (!fileId) return url;
  
  // Formato alternativo que funciona mejor para imágenes públicas de Google Drive
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
};

// Función para manejar errores de carga de imágenes
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSrc: string = '/images/pruebafoto.jpg') => {
  const target = e.target as HTMLImageElement;
  target.src = fallbackSrc;
};

// Tipos de datos basados en la API
type ImageType = 'GALLERY' | 'BEFORE_AFTER' | 'SERVICE' | 'TEMP';

interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: ImageType;
  category?: string;
  title?: string;
  serviceId?: string;
  serviceName?: string;      // Nombre del servicio real si está vinculado
  isActive: boolean;
  isHighlight?: boolean;
  hasAfterImage?: boolean;      // Para imágenes de antes/después
  afterImageUrl?: string;       // URL de la imagen "después"
  beforeAfterPair?: {
    before: string;
    after: string;
  };
  displayServiceName?: string;    // Nombre del servicio visual (sin vinculación)
  displayServiceCategory?: string; // Categoría del servicio visual (sin vinculación)
}

// Datos de ejemplo para mostrar cuando no hay suficientes imágenes de cada tipo
const exampleImages: GalleryImage[] = [
  {
    id: 'example-gallery',
    url: '/images/pruebafoto.jpg',
    type: 'GALLERY',
    category: 'Acrílicas',
    title: 'Ejemplo de Galería',
    isActive: true,
    isHighlight: true
  },
  {
    id: 'example-before-after',
    url: '/images/pruebafoto.jpg',
    type: 'BEFORE_AFTER',
    category: 'Transformaciones',
    title: 'Ejemplo de Antes/Después',
    isActive: true,
    hasAfterImage: true,
    afterImageUrl: '/images/pruebafoto.jpg'
  },
  {
    id: 'example-service',
    url: '/images/pruebafoto.jpg',
    type: 'SERVICE',
    category: 'Servicios Premium',
    title: 'Ejemplo de Servicio',
    serviceId: '2',
    isActive: true
  }
];

export function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeFilter, setActiveFilter] = useState<ImageType | 'ALL'>('ALL');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar imágenes desde la API
  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching images from:', `${API_URL}/api/images/gallery`);
        const response = await fetch(`${API_URL}/api/images/gallery`);
        
        if (!response.ok) {
          throw new Error('Error al cargar imágenes');
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        let apiImages: GalleryImage[] = Array.isArray(data) ? data : 
                        (data.images && Array.isArray(data.images)) ? data.images : [];
        
        console.log('Parsed apiImages:', apiImages);
        
        apiImages = apiImages.map(img => {
          console.log(`Procesando imagen en landing: ${img.id}, tipo: ${img.type}`);
          
          // Variable para imágenes de antes/después
          let hasAfterImage = false;
          let afterImageUrl = undefined;
          
          // Para imágenes antes/después, preparar URLs para la vista
          if (img.type === 'BEFORE_AFTER' && img.beforeAfterPair) {
            const beforeAfterData = img.beforeAfterPair;
            
            hasAfterImage = !!beforeAfterData.after;
            afterImageUrl = beforeAfterData.after;
          }
          
          // Convertir la URL principal
          if (img.url) {
            img.url = getGoogleDriveImageUrl(img.url);
          }
          
          // Convertir la URL de la imagen después
          if (afterImageUrl) {
            afterImageUrl = getGoogleDriveImageUrl(afterImageUrl);
          }
          
          // Convertir la URL de la miniatura si existe
          if (img.thumbnailUrl) {
            img.thumbnailUrl = getGoogleDriveImageUrl(img.thumbnailUrl);
          }
          
          return {
            ...img,
            id: img.id || `img-${Math.random().toString(36).substring(7)}`,
            isActive: true, // Asumimos que todas las imágenes devueltas son activas
            hasAfterImage: hasAfterImage,
            afterImageUrl: afterImageUrl,
            // Para mostrar nombre de servicio visual, priorizar displayServiceName
            serviceName: img.displayServiceName || img.serviceName,
            category: img.type === 'SERVICE' ? (img.displayServiceCategory || img.category) : img.category
          };
        });
        
        console.log('Processed apiImages:', apiImages);
        
        // Verificar si hay al menos una imagen de cada tipo, si no, agregar ejemplos
        const hasGallery = apiImages.some((img: GalleryImage) => img.type === 'GALLERY');
        const hasBeforeAfter = apiImages.some((img: GalleryImage) => img.type === 'BEFORE_AFTER');
        const hasService = apiImages.some((img: GalleryImage) => img.type === 'SERVICE');
        
        let finalImages = [...apiImages];
        
        // Agregar ejemplos si no hay suficientes imágenes de cada tipo
        if (!hasGallery) finalImages.push(exampleImages[0]);
        if (!hasBeforeAfter) finalImages.push(exampleImages[1]);
        if (!hasService) finalImages.push(exampleImages[2]);
        
        console.log('Final images with examples:', finalImages);
        setImages(finalImages);
      } catch (err) {
        console.error('Error al obtener imágenes:', err);
        setError('No se pudieron cargar las imágenes');
        
        // Si hay error, usar los ejemplos
        setImages(exampleImages);
      } finally {
        setLoading(false);
      }
    }
    
    fetchImages();
  }, []);

  // Filtrar imágenes según el filtro activo
  const filteredImages = activeFilter === 'ALL' 
    ? images.filter(img => {
        // Para tipo SERVICE, mostrar solo los que tienen displayServiceName
        if (img.type === 'SERVICE') {
          return img.displayServiceName && !img.serviceId;
        }
        return true;
      })
    : images.filter(img => {
        if (activeFilter === 'SERVICE' && activeSubcategory) {
          // Para servicios visuales, filtrar por displayServiceCategory
          return img.type === activeFilter && 
                 img.displayServiceCategory === activeSubcategory && 
                 img.displayServiceName && 
                 !img.serviceId;
        }
        return img.type === activeFilter;
      });

  // Obtener categorías de servicios únicas para filtros (solo servicios visuales)
  const serviceCategories = [...new Set(
    images
      .filter((img: GalleryImage) => 
        img.type === 'SERVICE' && 
        img.displayServiceName && 
        !img.serviceId
      )
      .map((img: GalleryImage) => img.displayServiceCategory)
      .filter(Boolean)
  )] as string[];

  const filters: { label: string; value: ImageType | 'ALL'; subcategories?: string[] }[] = [
    { label: 'Todo', value: 'ALL' },
    { label: 'Galería', value: 'GALLERY' },
    { label: 'Antes/Después', value: 'BEFORE_AFTER' },
    { 
      label: 'Servicios', 
      value: 'SERVICE',
      subcategories: serviceCategories.length > 0 ? serviceCategories : ['Acrílicas', 'Semipermanentes', 'Pedicure']
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
          {activeFilter === 'SERVICE' && serviceCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6"
            >
              {serviceCategories.map((subcat) => (
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

        {/* Estado de carga */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-2"></div>
            <p className="text-gray-500">Cargando imágenes...</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-gray-500">Mostrando imágenes de ejemplo</p>
          </div>
        )}

        {/* Grid de imágenes */}
        {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 max-w-5xl mx-auto">
            {filteredImages.map((image, index) => {
              console.log(`Renderizando imagen ${image.id}, tipo: ${image.type}, hasAfterImage: ${image.hasAfterImage}, afterImageUrl: ${image.afterImageUrl || 'no hay'}`);
              
              return (
            <motion.div
                  key={image.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square group cursor-pointer"
                  onClick={() => {
                    // Convertir las URLs de Drive antes de mostrar el lightbox
                    const selectedImg = { ...image };
                    if (selectedImg.url) {
                      selectedImg.url = getGoogleDriveImageUrl(selectedImg.url);
                    }
                    if (selectedImg.afterImageUrl) {
                      selectedImg.afterImageUrl = getGoogleDriveImageUrl(selectedImg.afterImageUrl);
                    }
                    if (selectedImg.thumbnailUrl) {
                      selectedImg.thumbnailUrl = getGoogleDriveImageUrl(selectedImg.thumbnailUrl);
                    }
                    setSelectedImage(selectedImg);
                  }}
                >
                  {/* Badge de destacado siempre visible */}
                  {image.isHighlight && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
                        ⭐
                      </span>
                    </div>
                  )}

                  {image.type === 'BEFORE_AFTER' && image.hasAfterImage && image.afterImageUrl ? (
                    // Renderizado especial para imágenes antes/después
                    <div className="relative w-full h-full">
                      {/* LOGS: Renderizando imagen dividida */}
                      <div className="absolute inset-0 flex">
                        {/* Imagen Antes (izquierda) */}
                        <div className="w-1/2 relative overflow-hidden">
                          {image.url && (
                            // Usar Image de Next.js para mejor compatibilidad
                            <div className="w-full h-full">
                              <Image
                                src={image.url}
                                alt={`Antes - ${image.title || image.category || 'Comparativa'}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                                onError={(e) => {
                                  console.error(`Error cargando imagen ANTES ${image.id}:`, image.url);
                                  // Intentar con formato alternativo antes de usar imagen de respaldo
                                  const target = e.target as HTMLImageElement;
                                  const currentSrc = target.src;
                                  
                                  if (currentSrc.includes('drive.google.com')) {
                                    const fileId = getGoogleDriveImageUrl(currentSrc).split('id=')[1]?.split('&')[0];
                                    if (fileId) {
                                      // Intentar con otro formato alternativo
                                      target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                                      return;
                                    }
                                  }
                                  
                                  // Si todo falla, usar imagen de respaldo
                                  target.src = '/images/pruebafoto.jpg';
                                }}
                              />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-white/80 text-black px-2 py-0.5 rounded-sm text-xs font-medium">
                            Antes
                          </div>
                        </div>
                        {/* Imagen Después (derecha) */}
                        <div className="w-1/2 relative overflow-hidden">
                          {image.afterImageUrl && (
                            // Usar Image de Next.js para mejor compatibilidad
                            <div className="w-full h-full relative">
                              <Image
                                src={image.afterImageUrl}
                                alt={`Después - ${image.title || image.category || 'Comparativa'}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                                onError={(e) => {
                                  console.error(`Error cargando imagen DESPUÉS ${image.id}:`, image.afterImageUrl);
                                  // Intentar con formato alternativo antes de usar imagen de respaldo
                                  const target = e.target as HTMLImageElement;
                                  const currentSrc = target.src;
                                  
                                  if (currentSrc.includes('drive.google.com')) {
                                    const fileId = getGoogleDriveImageUrl(currentSrc).split('id=')[1]?.split('&')[0];
                                    if (fileId) {
                                      // Intentar con otro formato alternativo
                                      target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                                      return;
                                    }
                                  }
                                  
                                  // Si todo falla, usar imagen de respaldo
                                  target.src = '/images/pruebafoto.jpg';
                                }}
                              />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-pink-500/80 text-white px-2 py-0.5 rounded-sm text-xs font-medium">
                            Después
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Renderizado normal para otros tipos de imágenes
                    <div className="relative w-full h-full">
                      <Image
                        src={image.thumbnailUrl || image.url}
                        alt={image.title || image.category || 'Imagen de galería'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        onError={(e) => {
                          console.error('Error cargando imagen:', image.thumbnailUrl || image.url);
                          // Intentar con formato alternativo antes de usar imagen de respaldo
                          const target = e.target as HTMLImageElement;
                          const currentSrc = target.src;
                          
                          if (currentSrc.includes('drive.google.com')) {
                            const fileId = getGoogleDriveImageUrl(currentSrc).split('id=')[1]?.split('&')[0];
                            if (fileId) {
                              // Intentar con otro formato alternativo
                              target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                              return;
                            }
                          }
                          
                          // Si todo falla, usar imagen de respaldo
                          target.src = '/images/pruebafoto.jpg';
                        }}
                      />
                    </div>
                  )}
              
              {/* Overlay elegante */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {/* Badge de tipo */}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1.5 ${
                    image.type === 'BEFORE_AFTER' ? 'bg-blue-500/90' :
                    image.type === 'SERVICE' ? 'bg-green-500/90' :
                    'bg-pink-500/90'
                  } text-white`}>
                    {image.type === 'BEFORE_AFTER' ? '✨ Antes/Después' :
                    image.type === 'SERVICE' ? '💅 ' + (image.displayServiceCategory || image.category || 'Servicio') :
                     '🎨 Galería'}
                  </span>
                      
                      {/* Badge de destacado */}
                      {image.isHighlight && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium mb-1.5 ml-1 bg-yellow-500/90 text-white">
                          ⭐ Destacada
                        </span>
                      )}
                      
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {image.type === 'SERVICE' && image.displayServiceName ? 
                      image.displayServiceName : 
                      (image.title || image.category || 'Sin título')}
                  </p>
                </div>
              </div>

                  {/* Ya no necesitamos este indicador porque ya mostramos ambas imágenes directamente */}
                  {image.type === 'BEFORE_AFTER' && image.hasAfterImage && !image.afterImageUrl && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-md">
                      Ver comparativa
                    </div>
                  )}
            </motion.div>
              );
            })}
          </div>
        )}

        {/* Mensaje cuando no hay imágenes */}
        {!loading && filteredImages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No se encontraron imágenes para este filtro</p>
        </div>
        )}

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
                    {selectedImage.type === 'BEFORE_AFTER' && selectedImage.afterImageUrl ? (
                      <div className="relative aspect-square">
                        <div className="absolute inset-0 flex">
                          {/* Imagen Antes */}
                          <div className="w-1/2 relative overflow-hidden">
                            {selectedImage.url && (
                              // Usar Image de Next.js para mejor compatibilidad
                              <div className="w-full h-full">
                                <Image
                                  src={selectedImage.url}
                                  alt="Antes"
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="object-cover"
                                  onError={(e) => {
                                    // Intentar con formato alternativo antes de usar imagen de respaldo
                                    const target = e.target as HTMLImageElement;
                                    const currentSrc = target.src;
                                    
                                    if (currentSrc.includes('drive.google.com')) {
                                      const fileId = getGoogleDriveImageUrl(currentSrc).split('id=')[1]?.split('&')[0];
                                      if (fileId) {
                                        // Intentar con otro formato alternativo
                                        target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                                        return;
                                      }
                                    }
                                    
                                    // Si todo falla, usar imagen de respaldo
                                    target.src = '/images/pruebafoto.jpg';
                                  }}
                                />
                              </div>
                            )}
                            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                              Antes
                            </div>
                          </div>
                          {/* Imagen Después */}
                          <div className="w-1/2 relative overflow-hidden">
                            {selectedImage.afterImageUrl && (
                              // Usar Image de Next.js para mejor compatibilidad
                              <div className="w-full h-full">
                                <Image
                                  src={selectedImage.afterImageUrl}
                                  alt="Después"
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="object-cover"
                                  onError={(e) => {
                                    // Intentar con formato alternativo antes de usar imagen de respaldo
                                    const target = e.target as HTMLImageElement;
                                    const currentSrc = target.src;
                                    
                                    if (currentSrc.includes('drive.google.com')) {
                                      const fileId = getGoogleDriveImageUrl(currentSrc).split('id=')[1]?.split('&')[0];
                                      if (fileId) {
                                        // Intentar con otro formato alternativo
                                        target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                                        return;
                                      }
                                    }
                                    
                                    // Si todo falla, usar imagen de respaldo
                                    target.src = '/images/pruebafoto.jpg';
                                  }}
                                />
                              </div>
                            )}
                            <div className="absolute top-4 right-4 bg-pink-500/80 text-white px-3 py-1 rounded-full text-sm">
                              Después
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-square">
                        <div className="w-full h-full">
                          <Image
                            src={selectedImage.thumbnailUrl || selectedImage.url}
                            alt={selectedImage.title || selectedImage.category || 'Imagen de galería'}
                            fill
                            sizes="(max-width: 768px) 100vw, 66vw"
                            className="object-cover"
                            onError={(e) => {
                              // Intentar con formato alternativo antes de usar imagen de respaldo
                              const target = e.target as HTMLImageElement;
                              const currentSrc = target.src;
                              
                              if (currentSrc.includes('drive.google.com')) {
                                const fileId = getGoogleDriveImageUrl(currentSrc).split('id=')[1]?.split('&')[0];
                                if (fileId) {
                                  // Intentar con otro formato alternativo
                                  target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                                  return;
                                }
                              }
                              
                              // Si todo falla, usar imagen de respaldo
                              target.src = '/images/pruebafoto.jpg';
                            }}
                          />
                        </div>
                        {/* Badge de destacado en el lightbox */}
                        {selectedImage.isHighlight && (
                          <div className="absolute top-4 right-4 z-10">
                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
                              <span className="text-lg">⭐</span>
                              <span>Destacada</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panel de información */}
                  <div className="w-full md:w-1/3 p-6 bg-white flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedImage.type === 'SERVICE' ? 
                          selectedImage.displayServiceName : 
                          (selectedImage.title || selectedImage.category || 'Sin título')}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedImage.type === 'BEFORE_AFTER' ? 'bg-blue-500 text-white' :
                          selectedImage.type === 'SERVICE' ? 'bg-green-500 text-white' :
                          'bg-pink-500 text-white'
                        }`}>
                          {selectedImage.type === 'BEFORE_AFTER' ? '✨ Transformación' :
                           selectedImage.type === 'SERVICE' ? '💅 Servicio visual' :
                           '🎨 Diseño'}
                        </span>
                        
                        {/* Badge de destacado en el panel de información */}
                        {selectedImage.isHighlight && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                            ⭐ Destacada
                          </span>
                        )}
                      </div>

                      {selectedImage.type === 'SERVICE' && selectedImage.displayServiceCategory && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Categoría:</span> {selectedImage.displayServiceCategory}
                        </p>
                      )}

                      {selectedImage.title && selectedImage.type === 'SERVICE' && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Descripción:</span> {selectedImage.title}
                        </p>
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
