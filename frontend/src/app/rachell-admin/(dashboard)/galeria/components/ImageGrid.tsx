'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Image as ImageType, ImageType as ImageTypeEnum } from '../types';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';

interface ImageGridProps {
  images: ImageType[];
  onUpdateImage: (id: string, data: Partial<ImageType>) => Promise<void>;
  onDeleteImage: (id: string) => Promise<void>;
  excludeTypes?: ImageTypeEnum[]; // Tipos de imágenes a excluir
  includeTypes?: ImageTypeEnum[]; // Tipos de imágenes a incluir exclusivamente
  services?: { id: string; name: string; category?: string }[]; // Lista de servicios para mostrar nombres
}

export default function ImageGrid({ 
  images, 
  onUpdateImage, 
  onDeleteImage,
  excludeTypes = [],
  includeTypes,
  services = []
}: ImageGridProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  const isServiceGalleryImage = (image: ImageType): boolean => {
    // Considerar una imagen como servicio visual solo si tiene displayServiceName
    // y opcionalmente no tiene serviceId (relación con servicios reales)
    return image.type === 'SERVICE' && 
           Boolean(image.displayServiceName) && 
           !image.serviceId;
  };

  const toggleSection = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleToggleActive = async (image: ImageType) => {
    try {
      setUpdating(image.id);
      console.log("Cambiando isActive:", image.id, "de", image.isActive, "a", !image.isActive);
      // Crear un objeto con el tipo correcto
      const data: Partial<ImageType> = { 
        isActive: !image.isActive 
      };
      await onUpdateImage(image.id, data);
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleHighlight = async (image: ImageType) => {
    try {
      setUpdating(image.id);
      console.log('Estado actual de isHighlight:', image.isHighlight);
      console.log('Cambiando isHighlight a:', !image.isHighlight);
      
      const updatedData: Partial<ImageType> = {
        isHighlight: !image.isHighlight
      };
      
      await onUpdateImage(image.id, updatedData);
      
      toast.success(
        image.isHighlight 
          ? 'Imagen quitada de destacados'
          : 'Imagen marcada como destacada',
        {
          description: `isHighlight cambiado a: ${!image.isHighlight}`
        }
      );
    } catch (error) {
      console.error('Error al actualizar isHighlight:', error);
      toast.error('Error al actualizar el estado destacado');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setImageToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;
    
    try {
      setDeleting(imageToDelete);
      await onDeleteImage(imageToDelete);
    } finally {
      setDeleting(null);
      setImageToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  // Filtrar imágenes según los tipos a incluir o excluir
  let filteredImages = Array.isArray(images) 
    ? images.filter(image => image && typeof image === 'object' && !image.isAfterImage)
    : [];
  
  // Si se especificaron tipos a incluir, solo mostrar esos tipos
  if (includeTypes && includeTypes.length > 0) {
    filteredImages = filteredImages.filter(image => includeTypes.includes(image.type));
  } 
  // Si no hay tipos específicos a incluir pero hay tipos a excluir
  else if (excludeTypes.length > 0) {
    filteredImages = filteredImages.filter(image => !excludeTypes.includes(image.type));
  }

  if (filteredImages.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No se encontraron imágenes</p>
      </div>
    );
  }

  // Agrupar imágenes por tipo
  const imagesByType = filteredImages.reduce((acc, image) => {
    // Para el tipo SERVICE, solo contar las imágenes de servicio visuales
    if (image.type === 'SERVICE') {
      if (isServiceGalleryImage(image)) {
        if (!acc[image.type]) {
          acc[image.type] = [];
        }
        acc[image.type].push(image);
      }
    } else {
      // Para otros tipos, mantener el comportamiento original
      if (!acc[image.type]) {
        acc[image.type] = [];
      }
      acc[image.type].push(image);
    }
    return acc;
  }, {} as Record<ImageTypeEnum, ImageType[]>);

  const getTypeLabel = (type: ImageTypeEnum) => {
    switch (type) {
      case 'GALLERY': return 'Galería';
      case 'BEFORE_AFTER': return 'Antes/Después';
      case 'SERVICE': return 'Servicio visual';
      case 'TEMP': return 'Temporal';
      default: return type;
    }
  };

  // Función para obtener el nombre del servicio basado en su ID
  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  // Función para obtener la categoría del servicio basado en su ID
  const getServiceCategory = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service?.category || 'Sin categoría';
  };

  // Función para agrupar imágenes de servicio por categoría
  const groupServiceImagesByCategory = (serviceImages: ImageType[]): Record<string, ImageType[]> => {
    // Filtrar para mostrar SOLO las imágenes de servicio visuales (con displayServiceName)
    const galleryServiceImages = serviceImages.filter(image => isServiceGalleryImage(image));
    
    return galleryServiceImages.reduce((acc, image) => {
      // Para servicios visuales, usar displayServiceCategory en lugar de category
      const category = image.displayServiceCategory || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(image);
      return acc;
    }, {} as Record<string, ImageType[]>);
  };

  return (
    <div className="bg-white">
      <div className="p-3 sm:p-6">
        {/* Renderizar cada grupo de imágenes por tipo */}
        {Object.keys(imagesByType).map(type => {
          const isExpanded = expandedTypes[type] ?? false; // Por defecto colapsado
          const imagesForType = imagesByType[type as ImageTypeEnum];
          
          return (
            <div key={type} className="mb-4 sm:mb-8 animate-fadeIn">
              <div
                onClick={() => toggleSection(type)}
                className="w-full flex items-center gap-2 text-base sm:text-lg font-medium mb-2 sm:mb-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer select-none"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
                <span>
                  {getTypeLabel(type as ImageTypeEnum)} ({imagesForType.length})
                </span>
              </div>
              
              {isExpanded && type === 'SERVICE' ? (
                // Para las imágenes de servicio, mostrarlas agrupadas por categoría
                <div className="space-y-6">
                  {Object.entries(groupServiceImagesByCategory(imagesForType)).map(([category, categoryImages]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700 px-3">{category}</h3>
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {categoryImages.map((image, index) => (
                          <div 
                            key={image.id} 
                            className={`group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                              image.isActive ? 'border border-gray-200' : 'border-2 border-red-500 bg-red-50'
                            } animate-fadeIn`}
                            style={{
                              animationDelay: `${index * 50}ms`
                            }}
                          >
                            <div className="aspect-square relative">
                              <div className="relative w-full h-full overflow-hidden">
                                <Image
                                  src={image.thumbnailUrl || image.url}
                                  alt={image.title || 'Imagen de servicio'}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                  className={`object-cover transition-all duration-300 ${
                                    !image.isActive ? 'opacity-60' : ''
                                  } group-hover:scale-110`}
                                />
                              </div>
                              
                              {/* Badges con animación */}
                              <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                                <span className={`text-white text-xs px-2 py-1 rounded-full transform transition-transform duration-200 hover:scale-105 ${
                                  isServiceGalleryImage(image) 
                                    ? 'bg-teal-500' // Color diferente para imágenes de servicio creadas desde galería
                                    : 'bg-green-500' // Color original para imágenes creadas desde servicios
                                }`}>
                                  {isServiceGalleryImage(image) 
                                    ? 'Galería-Servicio' 
                                    : 'Servicio'}
                                </span>
                                {image.isHighlight && (
                                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full transform transition-transform duration-200 hover:scale-105">
                                    Destacada
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Información con animación */}
                            <div className="p-3 transition-all duration-200 group-hover:bg-gray-50">
                              <h4 className="font-medium text-sm truncate transition-colors duration-200 group-hover:text-pink-600">
                                {/* Para servicios visuales, mostrar displayServiceName */}
                                {isServiceGalleryImage(image) && image.displayServiceName ? 
                                  image.displayServiceName : 
                                  (image.title || 'Sin título')}
                              </h4>
                              {image.category && !isServiceGalleryImage(image) && (
                                <p className="text-xs text-gray-500 truncate">
                                  Categoría: {image.category}
                                </p>
                              )}
                              
                              {isServiceGalleryImage(image) && image.displayServiceCategory && (
                                <p className="text-xs text-gray-500 truncate">
                                  Categoría: {image.displayServiceCategory}
                                </p>
                              )}
                              
                              {image.type === 'SERVICE' && image.serviceId && (
                                <p className="text-xs text-green-600 truncate mt-1">
                                  Servicio: {getServiceName(image.serviceId)}
                                </p>
                              )}
                              
                              {isServiceGalleryImage(image) && image.displayServiceCategory && (
                                <p className="text-xs text-gray-500 truncate">
                                  Categoría: {image.displayServiceCategory}
                                </p>
                              )}
                              
                              {image.type === 'BEFORE_AFTER' && (
                                <div className="mt-1">
                                  {image.beforeAfterPair?.after ? (
                                    <p className="text-xs text-blue-600 transition-colors duration-200">
                                      ✓ Comparativa completa
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500 transition-colors duration-200">
                                      ✗ Falta imagen "después"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Acciones con animación - Botones más grandes para móviles */}
                            <div className="border-t border-gray-200 p-2 flex justify-between bg-white transition-all duration-200 group-hover:bg-gray-50">
                              <div className="flex space-x-1 sm:space-x-1.5">
                                <Link
                                  href={`/rachell-admin/galeria/editar/${image.id}`}
                                  className="text-gray-600 hover:text-gray-900 bg-gray-100 p-1.5 sm:p-1.5 rounded-md transition-all duration-200 hover:bg-gray-200 min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation"
                                  aria-label="Editar imagen"
                                >
                                  <PencilIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(image.id)}
                                  disabled={deleting === image.id}
                                  className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 sm:p-1.5 rounded-md disabled:opacity-50 transition-all duration-200 hover:bg-red-100 min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation"
                                  aria-label="Eliminar imagen"
                                >
                                  <TrashIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                              
                              <div className="flex space-x-1 sm:space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(image)}
                                  disabled={updating === image.id}
                                  className={`p-1.5 sm:p-1.5 rounded-md transition-all duration-200 min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation ${
                                    image.isActive
                                      ? 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                                      : 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                                  }`}
                                  aria-label={image.isActive ? "Desactivar imagen" : "Activar imagen"}
                                >
                                  {image.isActive ? <EyeIcon className="h-4 w-4 sm:h-4 sm:w-4" /> : <EyeSlashIcon className="h-4 w-4 sm:h-4 sm:w-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleHighlight(image)}
                                  disabled={updating === image.id || image.type === 'TEMP'}
                                  className={`p-1.5 sm:p-1.5 rounded-md transition-all duration-200 relative min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation ${
                                    image.isHighlight
                                      ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100'
                                      : 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                                  } ${image.type === 'TEMP' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={image.isHighlight ? 'Quitar de destacados' : 'Marcar como destacada'}
                                  aria-label={image.isHighlight ? "Quitar de destacados" : "Marcar como destacada"}
                                >
                                  {updating === image.id ? (
                                    <div className="animate-spin h-4 w-4 sm:h-4 sm:w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
                                  ) : (
                                    image.isHighlight ? <StarIconSolid className="h-4 w-4 sm:h-4 sm:w-4" /> : <StarIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : isExpanded ? (
                // Para otros tipos de imágenes, mantener el diseño original
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {imagesForType.map((image, index) => (
                    <div 
                      key={image.id} 
                      className={`group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                        image.isActive ? 'border border-gray-200' : 'border-2 border-red-500 bg-red-50'
                      } animate-fadeIn`}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="aspect-square relative">
                        {image.type === 'BEFORE_AFTER' && image.beforeAfterPair?.before && image.beforeAfterPair?.after ? (
                          <div className="relative w-full h-full flex">
                            <div className="w-1/2 relative overflow-hidden">
                              <Image
                                src={image.beforeAfterPair.before}
                                alt={image.title || 'Imagen antes'}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute top-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                Antes
                              </div>
                            </div>
                            <div className="w-1/2 relative overflow-hidden">
                              <Image
                                src={image.beforeAfterPair.after}
                                alt={`${image.title || 'Imagen'} (Después)`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute top-1 right-1 bg-pink-500/80 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                Después
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full overflow-hidden">
                            <Image
                              src={image.thumbnailUrl || image.url}
                              alt={image.title || 'Imagen de galería'}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                              className={`object-cover transition-all duration-300 ${
                                !image.isActive ? 'opacity-60' : ''
                              } group-hover:scale-110`}
                            />
                          </div>
                        )}
                        
                        {/* Badges con animación */}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          {image.type === 'GALLERY' && (
                            <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full transform transition-transform duration-200 hover:scale-105">
                              Galería
                            </span>
                          )}
                          {image.type === 'BEFORE_AFTER' && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full transform transition-transform duration-200 hover:scale-105">
                              Antes/Después
                            </span>
                          )}
                          {image.type === 'SERVICE' && (
                            <span className={`text-white text-xs px-2 py-1 rounded-full transform transition-transform duration-200 hover:scale-105 ${
                              isServiceGalleryImage(image) 
                                ? 'bg-teal-500' // Color diferente para imágenes de servicio creadas desde galería
                                : 'bg-green-500' // Color original para imágenes creadas desde servicios
                            }`}>
                              {isServiceGalleryImage(image) 
                                ? 'Galería-Servicio' 
                                : 'Servicio'}
                            </span>
                          )}
                          {image.isHighlight && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full transform transition-transform duration-200 hover:scale-105">
                              Destacada
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Información con animación */}
                      <div className="p-3 transition-all duration-200 group-hover:bg-gray-50">
                        <h4 className="font-medium text-sm truncate transition-colors duration-200 group-hover:text-pink-600">
                          {/* Para servicios visuales, mostrar displayServiceName */}
                          {isServiceGalleryImage(image) && image.displayServiceName ? 
                            image.displayServiceName : 
                            (image.title || 'Sin título')}
                        </h4>
                        {image.category && !isServiceGalleryImage(image) && (
                          <p className="text-xs text-gray-500 truncate">
                            Categoría: {image.category}
                          </p>
                        )}
                        
                        {isServiceGalleryImage(image) && image.displayServiceCategory && (
                          <p className="text-xs text-gray-500 truncate">
                            Categoría: {image.displayServiceCategory}
                          </p>
                        )}
                        
                        {image.type === 'SERVICE' && image.serviceId && (
                          <p className="text-xs text-green-600 truncate mt-1">
                            Servicio: {getServiceName(image.serviceId)}
                          </p>
                        )}
                        
                        {isServiceGalleryImage(image) && (
                          <p className="text-xs text-teal-600 truncate mt-1">
                            Galería-Servicio
                          </p>
                        )}
                        
                        {image.type === 'BEFORE_AFTER' && (
                          <div className="mt-1">
                            {image.beforeAfterPair?.after ? (
                              <p className="text-xs text-blue-600 transition-colors duration-200">
                                ✓ Comparativa completa
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 transition-colors duration-200">
                                ✗ Falta imagen "después"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Acciones con animación - Botones más grandes para móviles */}
                      <div className="border-t border-gray-200 p-2 flex justify-between bg-white transition-all duration-200 group-hover:bg-gray-50">
                        <div className="flex space-x-1 sm:space-x-1.5">
                          <Link
                            href={`/rachell-admin/galeria/editar/${image.id}`}
                            className="text-gray-600 hover:text-gray-900 bg-gray-100 p-1.5 sm:p-1.5 rounded-md transition-all duration-200 hover:bg-gray-200 min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation"
                            aria-label="Editar imagen"
                          >
                            <PencilIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(image.id)}
                            disabled={deleting === image.id}
                            className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 sm:p-1.5 rounded-md disabled:opacity-50 transition-all duration-200 hover:bg-red-100 min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation"
                            aria-label="Eliminar imagen"
                          >
                            <TrashIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-1 sm:space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(image)}
                            disabled={updating === image.id}
                            className={`p-1.5 sm:p-1.5 rounded-md transition-all duration-200 min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation ${
                              image.isActive
                                ? 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                                : 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                            }`}
                            aria-label={image.isActive ? "Desactivar imagen" : "Activar imagen"}
                          >
                            {image.isActive ? <EyeIcon className="h-4 w-4 sm:h-4 sm:w-4" /> : <EyeSlashIcon className="h-4 w-4 sm:h-4 sm:w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleHighlight(image)}
                            disabled={updating === image.id || image.type === 'TEMP'}
                            className={`p-1.5 sm:p-1.5 rounded-md transition-all duration-200 relative min-w-[30px] min-h-[30px] flex items-center justify-center touch-manipulation ${
                              image.isHighlight
                                ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100'
                                : 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                            } ${image.type === 'TEMP' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={image.isHighlight ? 'Quitar de destacados' : 'Marcar como destacada'}
                            aria-label={image.isHighlight ? "Quitar de destacados" : "Marcar como destacada"}
                          >
                            {updating === image.id ? (
                              <div className="animate-spin h-4 w-4 sm:h-4 sm:w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
                            ) : (
                              image.isHighlight ? <StarIconSolid className="h-4 w-4 sm:h-4 sm:w-4" /> : <StarIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleConfirmDelete}
        title="Eliminar imagen"
        message="¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer."
        confirmText="Aceptar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
} 