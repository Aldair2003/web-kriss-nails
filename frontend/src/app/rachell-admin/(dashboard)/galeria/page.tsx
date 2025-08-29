'use client';

import { useState, useEffect } from 'react';
import { Image, ImageType } from './types';
import ImageFilters from './components/ImageFilters';
import ImageGrid from './components/ImageGrid';
import ImageUploader from './components/ImageUploader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { addImage, deleteImage, getImages, updateImage } from '@/services/image-service';
import { getServices } from '@/services/service-service';
import { useToast } from '@/components/ui/toast';
import { getServiceCategories, ServiceCategory } from '@/services/category-service';
import { API_URL } from '@/config';
import { getSession } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  category?: string;
}

export default function GaleriaPage() {
  const [allImages, setAllImages] = useState<Image[]>([]);   // Todas las imágenes sin filtrar
  const [images, setImages] = useState<Image[]>([]);         // Imágenes no SERVICE
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Cargar imágenes
  const loadImages = async (filters?: {
    type?: ImageType;
    category?: string;
    isActive?: boolean;
    serviceId?: string;
  }) => {
    try {
      setIsLoading(true);
      const data = await getImages(filters);
      
      // Guardar todas las imágenes
      setAllImages(data);
      
      // Mostrar todas las imágenes, incluyendo las de servicio
      setImages(data);
      setFilteredImages(data);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las imágenes. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar servicios
  const loadServices = async () => {
    try {
      setIsServicesLoading(true);
      const data = await getServices();
      
      // Verificar que data sea un array y manejar posibles errores
      if (Array.isArray(data)) {
        // Asegurarse de que cada servicio tenga el formato correcto
        const validServices = data
          .filter(service => 
            service && 
            typeof service === 'object' && 
            typeof service.id === 'string' && 
            typeof service.name === 'string'
          )
          .map(service => ({
            id: service.id,
            name: service.name,
            category: typeof service.category === 'string' ? service.category : undefined
          }));
        
        console.log('Servicios validados:', validServices);
        setServices(validServices);
      } else {
        console.error('La respuesta de getServices no es un array:', data);
        // Si no es un array, inicializamos con array vacío
        setServices([]);
        toast({
          title: 'Error',
          description: 'El formato de datos de servicios es incorrecto',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      // Inicializar con array vacío en caso de error
      setServices([]);
      toast({
        title: 'Advertencia',
        description: 'No se pudieron cargar los servicios. Algunas opciones pueden estar limitadas.',
        variant: 'warning'
      });
    } finally {
      setIsServicesLoading(false);
    }
  };

  // Cargar categorías de servicio
  const loadServiceCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const data = await getServiceCategories();
      
      if (Array.isArray(data)) {
        setServiceCategories(data);
      } else {
        console.error('La respuesta de getServiceCategories no es un array:', data);
        setServiceCategories([]);
      }
    } catch (error) {
      console.error('Error al cargar categorías de servicio:', error);
      setServiceCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    loadServices();
    loadServiceCategories();
  }, []);

  // Manejar filtros
  const handleFilterChange = async (filters: {
    type?: ImageType;
    category?: string;
    isActive?: boolean;
    serviceId?: string;
  }) => {
    console.log('Aplicando filtros:', filters);
    await loadImages(filters);
  };

  // Manejar subida de imágenes
  const handleImageUpload = async (
    file: File, 
    data: { 
      type: string; 
      category?: string; 
      title?: string; 
      afterFile?: File;
      displayServiceName?: string;
      displayServiceCategory?: string;
    }
  ) => {
    setIsUploading(true);
    
    try {
      if (data.type === 'BEFORE_AFTER' && data.afterFile) {
        // Subir par de imágenes antes/después
        await uploadBeforeAfterImages(file, data.afterFile, data.category, data.title);
      } else {
        // Subir imagen individual
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', data.type);
        
        if (data.category) formData.append('category', data.category);
        if (data.title) formData.append('title', data.title);
        
        // Campos para servicios visuales
        if (data.type === 'SERVICE') {
          if (data.displayServiceName) formData.append('displayServiceName', data.displayServiceName);
          if (data.displayServiceCategory) formData.append('displayServiceCategory', data.displayServiceCategory);
        }
        
        const response = await fetch(`${API_URL}/api/images`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${(await getSession())?.accessToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al subir la imagen');
        }
      }
      
      // Actualizar lista de imágenes
      await refreshImages();
      
      // Usar el toast de la UI
      toast({
        title: 'Éxito',
        description: 'Imagen subida exitosamente',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error al subir imagen:', error);
      
      // Usar el toast de la UI
      toast({
        title: 'Error',
        description: 'Error al subir la imagen',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Manejar actualización de imágenes
  const handleUpdateImage = async (id: string, data: Partial<Image>) => {
    try {
      const updatedImage = await updateImage(id, data);
      console.log('Imagen actualizada:', updatedImage);
      
      // Actualizar todas las imágenes
      const updatedAllImages = allImages.map(image => 
        image.id === id ? { ...image, ...updatedImage } : image
      );
      setAllImages(updatedAllImages);
      
      // Actualizar todas las listas de imágenes
      const updatedGalleryImages = images.map(image => 
        image.id === id ? { ...image, ...updatedImage } : image
      );
      setImages(updatedGalleryImages);
      
      const updatedFilteredImages = filteredImages.map(image => 
        image.id === id ? { ...image, ...updatedImage } : image
      );
      setFilteredImages(updatedFilteredImages);
      
      // Mostrar notificación específica para destacados
      if ('isHighlight' in data) {
        toast({
          title: updatedImage.isHighlight ? 'Imagen destacada' : 'Destacado removido',
          description: updatedImage.isHighlight 
            ? 'La imagen se mostrará en la sección destacada'
            : 'La imagen ya no aparecerá en destacados',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Éxito',
          description: 'Imagen actualizada correctamente',
          variant: 'default'
        });
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la imagen. Inténtalo de nuevo.',
        variant: 'destructive'
      });
      return Promise.reject(error);
    }
  };

  // Manejar eliminación de imágenes
  const handleDeleteImage = async (id: string) => {
    try {
      await deleteImage(id);
      
      // Actualizar todas las listas
      setAllImages(prev => prev.filter(image => image.id !== id));
      setImages(prev => prev.filter(image => image.id !== id));
      setFilteredImages(prev => prev.filter(image => image.id !== id));
      
      toast({
        title: 'Éxito',
        description: 'Imagen eliminada correctamente',
        variant: 'default'
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la imagen. Inténtalo de nuevo.',
        variant: 'destructive'
      });
      return Promise.reject(error);
    }
  };

  // Contadores para el encabezado (solo de imágenes que no son de servicio)
  const activeCount = images.filter(img => img.isActive).length;
  const inactiveCount = images.filter(img => !img.isActive).length;

  // Uploadar imágenes antes/después
  const uploadBeforeAfterImages = async (beforeImage: File, afterImage: File, category?: string, title?: string) => {
    const formData = new FormData();
    formData.append('files', beforeImage);
    formData.append('files', afterImage);
    if (category) formData.append('category', category);
    if (title) formData.append('title', title);
    
    const response = await fetch(`${API_URL}/api/images/before-after`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${(await getSession())?.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al subir imágenes antes/después');
    }
    
    return await response.json();
  };

  // Actualizar lista de imágenes
  const refreshImages = async () => {
    const response = await fetch(`${API_URL}/api/images`, {
      headers: {
        Authorization: `Bearer ${(await getSession())?.accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener imágenes');
    }
    
    return await response.json();
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Galería de Imágenes</h1>
        <div className="text-xs sm:text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm">
          <p>Total: {images.length} | Activas: {activeCount} | Inactivas: {inactiveCount}</p>
        </div>
      </div>
      
      {/* Sección de carga */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
          <h2 className="text-base sm:text-lg font-medium">Subir nueva imagen</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Selecciona el tipo de imagen y completa la información requerida</p>
        </div>
        <div className="p-4 sm:p-6">
          <ImageUploader
            onUpload={handleImageUpload}
            isUploading={isUploading}
            services={services}
            serviceCategories={serviceCategories}
            onCategoryCreated={loadServiceCategories}
            onCategoryDeleted={loadServiceCategories}
          />
        </div>
      </div>

      {/* Sección de filtros */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ImageFilters 
          onFilterChange={handleFilterChange} 
          isLoading={isLoading} 
          services={services}
        />
      </div>
      
      {/* Sección de imágenes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h2 className="text-base sm:text-lg font-medium">
            Imágenes ({filteredImages.length} de {images.length})
          </h2>
          <button
            onClick={() => loadImages()}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Cargando...</span>
              </>
            ) : 'Recargar'}
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8 sm:p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            {Array.isArray(filteredImages) ? (
              <ImageGrid 
                images={filteredImages} 
                onUpdateImage={handleUpdateImage}
                onDeleteImage={handleDeleteImage}
                services={services}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Error al cargar imágenes. Por favor, recarga la página.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 