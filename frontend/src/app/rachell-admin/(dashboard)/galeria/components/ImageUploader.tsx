'use client';

import { useState, useRef, ChangeEvent, useMemo, Fragment } from 'react';
import { CloudArrowUpIcon, PhotoIcon, ArrowPathIcon, ScissorsIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ImageType } from '../types';
import Image from 'next/image';
import { createServiceCategory, deleteServiceCategory, ServiceCategory } from '@/services/category-service';
import { useToast } from '@/components/ui/toast';
import { Dialog, Transition } from '@headlessui/react';

interface ImageUploaderProps {
  onUpload: (file: File, data: { type: ImageType; category?: string; title?: string; afterFile?: File; displayServiceName?: string; displayServiceCategory?: string }) => Promise<void>;
  isUploading?: boolean;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  services?: { id: string; name: string; category?: string }[];
  serviceCategories?: ServiceCategory[];
  onCategoryCreated?: () => void;
  onCategoryDeleted?: () => void;
}

export default function ImageUploader({ 
  onUpload, 
  isUploading = false, 
  maxSize = 5, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  services = [],
  serviceCategories = [],
  onCategoryCreated,
  onCategoryDeleted
}: ImageUploaderProps) {
  const { toast } = useToast()
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para las imágenes (incluye soporte para antes/después)
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);
  
  // Estado para las pestañas y formulario
  const [activeTab, setActiveTab] = useState<ImageType>('GALLERY');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  
  // Estado para modales de categorías
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  
  const [displayServiceName, setDisplayServiceName] = useState('');
  const [displayServiceCategory, setDisplayServiceCategory] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  // Asegurar que services sea un array válido
  const validServices = Array.isArray(services) ? services : [];

  // Obtener todas las categorías únicas de los servicios
  const availableCategories = useMemo(() => {
    // Si tenemos categorías proporcionadas como prop, usarlas
    if (serviceCategories && serviceCategories.length > 0) {
      return serviceCategories.map(cat => cat.name).sort();
    }
    
    // Como alternativa, extraer categorías de los servicios
    const categories = new Set<string>();
    
    validServices.forEach(service => {
      if (service && typeof service === 'object' && service.category) {
        categories.add(service.category);
      }
    });
    
    return Array.from(categories).sort();
  }, [validServices, serviceCategories]);

  // Filtrar servicios por categoría seleccionada
  const filteredServices = useMemo(() => {
    if (!serviceCategory) {
      return validServices;
    }
    
    return validServices.filter(service => 
      service && typeof service === 'object' && service.category === serviceCategory
    );
  }, [validServices, serviceCategory]);

  // Gestión de categorías
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Error', description: 'Debes proporcionar un nombre para la categoría', variant: 'destructive' });
      return;
    }

    try {
      setIsCreatingCategory(true);
      await createServiceCategory(newCategoryName.trim());
              toast({ title: 'Éxito', description: 'Categoría creada correctamente', variant: 'success' });
      
      // Cerrar modal y limpiar formulario
      setIsCreateCategoryModalOpen(false);
      setNewCategoryName('');
      
      // Si hay una función de callback para cuando se crea una categoría, llamarla
      if (onCategoryCreated) {
        onCategoryCreated();
      }
          } catch (error) {
        console.error('Error al crear categoría:', error);
        toast({ title: 'Error', description: 'No se pudo crear la categoría', variant: 'destructive' });
      } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeletingCategory(true);
      
      // Buscar el ID de la categoría
      const category = serviceCategories.find(cat => cat.name === categoryToDelete);
      
      if (!category) {
        toast({ title: 'Error', description: 'No se encontró la categoría seleccionada', variant: 'destructive' });
        setIsDeleteCategoryModalOpen(false);
        setIsDeletingCategory(false);
        return;
      }
      
      if (category.servicesCount && category.servicesCount > 0) {
        toast({ title: 'Error', description: `No se puede eliminar la categoría porque tiene ${category.servicesCount} servicios asociados`, variant: 'destructive' });
        setIsDeleteCategoryModalOpen(false);
        setIsDeletingCategory(false);
        return;
      }

      // Eliminar la categoría
      await deleteServiceCategory(category.id);
              toast({ title: 'Éxito', description: 'Categoría eliminada correctamente', variant: 'success' });
      
      // Resetear selección de categoría
      setServiceCategory('');
      
      // Cerrar modal
      setIsDeleteCategoryModalOpen(false);
      
      // Si hay una función de callback para cuando se elimina una categoría, llamarla
      if (onCategoryDeleted) {
        onCategoryDeleted();
      }
          } catch (error) {
        console.error('Error al eliminar categoría:', error);
        toast({ title: 'Error', description: 'No se pudo eliminar la categoría', variant: 'destructive' });
      } finally {
      setIsDeletingCategory(false);
    }
  };

  // Función para validar un archivo
  const validateFile = (selectedFile: File): string | null => {
    // Validar tipo de archivo
    if (!allowedTypes.includes(selectedFile.type)) {
      return `Tipo de archivo no permitido. Por favor, sube: ${allowedTypes.join(', ')}`;
    }
    
    // Validar tamaño de archivo
    const sizeInMB = selectedFile.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `El archivo es demasiado grande. El tamaño máximo es ${maxSize}MB.`;
    }
    
    return null;
  };

  // Manejar archivos seleccionados para el ANTES
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    const validationError = validateFile(selectedFile);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    
    // Generar URL de vista previa
    const preview = URL.createObjectURL(selectedFile);
    setPreviewUrl(preview);
  };

  // Manejar archivos seleccionados para el DESPUÉS
  const handleAfterFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    const validationError = validateFile(selectedFile);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setAfterFile(selectedFile);
    
    // Generar URL de vista previa
    const preview = URL.createObjectURL(selectedFile);
    setAfterPreviewUrl(preview);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleAfterChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleAfterFiles(e.target.files);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isAfterImage = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (isAfterImage) {
      handleAfterFiles(e.dataTransfer.files);
    } else {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Por favor, selecciona una imagen primero.');
      return;
    }
    
    // Para tipo BEFORE_AFTER, se necesitan ambas imágenes
    if (activeTab === 'BEFORE_AFTER' && !afterFile) {
      setError('Para Antes/Después, debes subir ambas imágenes.');
      return;
    }
    
    // Para tipo SERVICE, validar campos requeridos
    if (activeTab === 'SERVICE') {
      if (!displayServiceName) {
        setError('El nombre del servicio visual es obligatorio.');
        return;
      }
      if (!displayServiceCategory) {
        setError('Debes seleccionar una categoría para el servicio visual.');
        return;
      }
    }
    
    try {
      setError(null);
      
      const data: { 
        type: ImageType; 
        category?: string; 
        title?: string;
        afterFile?: File;
        displayServiceName?: string;
        displayServiceCategory?: string;
      } = { type: activeTab };
      
      // Para servicios visuales
      if (activeTab === 'SERVICE') {
        data.displayServiceName = displayServiceName;
        data.displayServiceCategory = displayServiceCategory;
        data.category = category; // Usamos category como descripción adicional
      } else {
        // Para otros tipos de imágenes
        if (category) data.category = category;
        if (title) data.title = title;
      }
      
      // Agregar el archivo "después" si estamos en modo antes/después
      if (activeTab === 'BEFORE_AFTER' && afterFile) {
        data.afterFile = afterFile;
      }
      
      await onUpload(file, data);
      
      // Resetear formulario después de subir
      setFile(null);
      setPreviewUrl(null);
      setAfterFile(null);
      setAfterPreviewUrl(null);
      setCategory('');
      setTitle('');
      setDisplayServiceName('');
      setDisplayServiceCategory('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (afterFileInputRef.current) {
        afterFileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Error al subir la imagen. Por favor, intenta de nuevo.');
      console.error(err);
    }
  };

  // Restablecer la segunda imagen (Después)
  const resetAfterImage = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setAfterFile(null);
    setAfterPreviewUrl(null);
    if (afterFileInputRef.current) {
      afterFileInputRef.current.value = '';
    }
  };

  // Restablecer la primera imagen (principal o Antes)
  const resetMainImage = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Vista previa para una sola imagen
  const renderImagePreview = (url: string | null, imgFile: File | null, onReset: (e?: React.MouseEvent) => void) => {
    if (!url || !imgFile) return null;

    return (
      <div className="flex flex-col items-center">
        <div className="relative h-32 w-32 sm:h-48 sm:w-48 mb-3 sm:mb-4">
          {/* eslint-disable-next-line */}
          <img
            src={url}
            alt="Vista previa"
            className="h-full w-full object-contain rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1 items-center text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            {imgFile.name} ({(imgFile.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
          <button
            type="button"
            className="text-xs sm:text-sm text-pink-600 hover:text-pink-800 transition-colors duration-200"
            onClick={onReset}
          >
            Cambiar imagen
          </button>
        </div>
      </div>
    );
  };

  // Información sobre destino de la imagen según el tipo
  const renderDestinationInfo = () => {
    if (!previewUrl && activeTab !== 'BEFORE_AFTER') return null;
    if (activeTab === 'BEFORE_AFTER' && !previewUrl && !afterPreviewUrl) return null;

    switch (activeTab) {
      case 'GALLERY':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
            <h4 className="font-medium text-gray-700 mb-2">ℹ️ Las imágenes de Galería se muestran en:</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>La sección "Nuestro Arte" de la página principal</li>
              <li>Se pueden filtrar por la categoría seleccionada</li>
              <li>Aparecen con el distintivo rosa de "Galería"</li>
            </ul>
            <div className="mt-3 border border-gray-200 rounded-md p-2 bg-white">
              <div className="text-xs text-gray-500 mb-1">Vista previa en la landing page:</div>
              <div className="aspect-square w-full max-w-[150px] mx-auto relative bg-gray-100 rounded overflow-hidden">
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line */}
                  <img src={previewUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">🎨 Galería</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'BEFORE_AFTER':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
            <h4 className="font-medium text-gray-700 mb-2">ℹ️ Las imágenes de Antes/Después se muestran en:</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>La sección de transformaciones en "Nuestro Arte"</li>
              <li>Al hacer clic, se ve la comparativa antes/después</li>
              <li>Aparecen con el distintivo azul de "Antes/Después"</li>
            </ul>
            <div className="mt-3 border border-gray-200 rounded-md p-2 bg-white">
              <div className="text-xs text-gray-500 mb-1">Vista previa en la landing page:</div>
              {previewUrl && afterPreviewUrl ? (
                <div className="flex justify-center gap-2">
                  <div className="aspect-square w-full max-w-[150px] relative bg-gray-100 rounded overflow-hidden">
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line */}
                      <img src={previewUrl || ''} alt="Antes" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full">Antes</span>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-square w-full max-w-[150px] relative bg-gray-100 rounded overflow-hidden">
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line */}
                      <img src={afterPreviewUrl || ''} alt="Después" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Después</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500">
                  <p>Selecciona ambas imágenes para ver la vista previa</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'SERVICE':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
            <h4 className="font-medium text-gray-700 mb-2">ℹ️ Las imágenes de Servicios se muestran en:</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>La tarjeta del servicio seleccionado</li>
              <li>La galería filtrada por servicios</li>
              <li>El catálogo de servicios completo</li>
            </ul>
            <div className="mt-3 border border-gray-200 rounded-md p-2 bg-white">
              <div className="text-xs text-gray-500 mb-1">Vista previa en la landing page:</div>
              <div className="aspect-square w-full max-w-[150px] mx-auto relative bg-gray-100 rounded overflow-hidden">
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line */}
                  <img src={previewUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">💅 Servicio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderFormFields = () => {
    const commonFields = (
      <>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Acrílicas, Nail Art..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
            disabled={isUploading}
          />
        </div>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título descriptivo de la imagen"
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
            disabled={isUploading}
          />
          <p className="mt-1 text-xs text-gray-500">Este texto se mostrará al ampliar la imagen.</p>
        </div>
      </>
    );

    // Campos específicos para servicios
    if (activeTab === 'SERVICE') {
      return (
        <>
          <div className="mt-4">
            <label htmlFor="displayServiceName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del servicio visual <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              id="displayServiceName"
              value={displayServiceName}
              onChange={(e) => setDisplayServiceName(e.target.value)}
              placeholder="Título principal del servicio"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
              disabled={isUploading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Este será el título principal que se mostrará en la galería.</p>
          </div>
          
          <div className="mt-4">
            <label htmlFor="displayServiceCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría del servicio visual <span className="text-pink-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                id="displayServiceCategory"
                value={displayServiceCategory}
                onChange={(e) => setDisplayServiceCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
                disabled={isUploading}
                required
              >
                <option value="">Selecciona una categoría</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCreateCategoryModalOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                title="Crear nueva categoría"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (displayServiceCategory) {
                    setCategoryToDelete(displayServiceCategory);
                    setIsDeleteCategoryModalOpen(true);
                  } else {
                    toast({ title: 'Error', description: 'Selecciona una categoría para eliminar', variant: 'destructive' });
                  }
                }}
                disabled={!displayServiceCategory}
                className={`inline-flex items-center justify-center p-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${!displayServiceCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Eliminar categoría seleccionada"
              >
                <TrashIcon className="h-5 w-5 text-red-600" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Esta categoría se usará para filtrar los servicios en la galería.</p>
          </div>

          <div className="mt-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Descripción que aparece debajo del título"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
              disabled={isUploading}
            />
            <p className="mt-1 text-xs text-gray-500">Este texto aparecerá como descripción debajo del título.</p>
          </div>
        </>
      );
    }

    return commonFields;
  };

  // Renderizar campo para subir imagen individual
  const renderSingleImageUploader = () => (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">1. Seleccionar imagen</h3>
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 cursor-pointer transition-colors ${
          dragActive 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:bg-gray-50'
        } ${previewUrl ? 'bg-gray-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => handleDrop(e)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept={allowedTypes.join(',')}
          className="hidden"
          disabled={isUploading}
        />
        
        {previewUrl ? (
          renderImagePreview(previewUrl, file, resetMainImage)
        ) : (
          <div className="flex flex-col items-center text-center">
            <CloudArrowUpIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-2" />
            <p className="text-base sm:text-lg text-gray-700 font-medium">
              Arrastre una imagen aquí o haga clic para seleccionarla
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              JPG, PNG, WebP o GIF (Max: {maxSize}MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar campos para antes/después
  const renderBeforeAfterUploaders = () => (
    <div className="mb-4 sm:mb-6 space-y-4">
      {/* Antes */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">1. Seleccionar imagen de ANTES</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 cursor-pointer transition-colors ${
            dragActive 
              ? 'border-pink-500 bg-pink-50' 
              : 'border-gray-300 hover:bg-gray-50'
          } ${previewUrl ? 'bg-gray-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleChange}
            accept={allowedTypes.join(',')}
            className="hidden"
            disabled={isUploading}
          />
          
          {previewUrl ? (
            renderImagePreview(previewUrl, file, resetMainImage)
          ) : (
            <div className="flex flex-col items-center text-center">
              <CloudArrowUpIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-2" />
              <p className="text-base sm:text-lg text-gray-700 font-medium">
                Seleccione la imagen de ANTES
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                JPG, PNG, WebP o GIF (Max: {maxSize}MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Después */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">2. Seleccionar imagen de DESPUÉS</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 cursor-pointer transition-colors ${
            dragActive 
              ? 'border-pink-500 bg-pink-50' 
              : 'border-gray-300 hover:bg-gray-50'
          } ${afterPreviewUrl ? 'bg-gray-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, true)}
          onClick={() => afterFileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={afterFileInputRef}
            onChange={handleAfterChange}
            accept={allowedTypes.join(',')}
            className="hidden"
            disabled={isUploading}
          />
          
          {afterPreviewUrl ? (
            renderImagePreview(afterPreviewUrl, afterFile, resetAfterImage)
          ) : (
            <div className="flex flex-col items-center text-center">
              <CloudArrowUpIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-2" />
              <p className="text-base sm:text-lg text-gray-700 font-medium">
                Seleccione la imagen de DESPUÉS
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                JPG, PNG, WebP o GIF (Max: {maxSize}MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
      {/* Pestañas de tipos de imagen */}
      <div className="flex flex-wrap sm:flex-nowrap border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
        <button
          type="button"
          className={`px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'GALLERY'
              ? 'text-pink-600 border-b-2 border-pink-500'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('GALLERY')}
        >
          Galería
        </button>
        <button
          type="button"
          className={`px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'BEFORE_AFTER'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('BEFORE_AFTER')}
        >
          Antes/Después
        </button>
        <button
          type="button"
          className={`px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === 'SERVICE'
              ? 'text-green-600 border-b-2 border-green-500'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('SERVICE')}
        >
          Servicios
        </button>
      </div>

      {/* Área para seleccionar imagen(es) */}
      <div className="max-w-3xl mx-auto">
        {activeTab === 'BEFORE_AFTER' ? renderBeforeAfterUploaders() : renderSingleImageUploader()}
        
        {/* Separador visual entre secciones */}
        {((previewUrl && activeTab !== 'BEFORE_AFTER') || 
          (activeTab === 'BEFORE_AFTER' && previewUrl && afterPreviewUrl)) && (
          <>
            {/* Sección de previsualización */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {activeTab === 'BEFORE_AFTER' ? '3. ' : '2. '}Previsualización
              </h3>
              {renderDestinationInfo()}
            </div>
            
            {/* Sección de información adicional */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {activeTab === 'BEFORE_AFTER' ? '4. ' : '3. '}Información de la imagen
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFormFields()}
              </div>
            </div>
          </>
        )}
        
        {/* Mostrar error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        {/* Botón subir */}
        <div className="mt-4 sm:mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !file || 
              isUploading || 
              (activeTab === 'SERVICE' && !displayServiceName && !displayServiceCategory) ||
              (activeTab === 'BEFORE_AFTER' && !afterFile)
            }
            className="w-full sm:w-auto min-w-[200px] mx-auto flex justify-center items-center rounded-md border border-transparent bg-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isUploading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                <span>Subiendo...</span>
              </>
            ) : <span>Subir imagen</span>}
          </button>
        </div>
      </div>

      {/* Modal para crear categoría */}
      <Transition appear show={isCreateCategoryModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateCategoryModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Crear nueva categoría de servicio
                  </Dialog.Title>
                  <div className="mt-4">
                    <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la categoría
                    </label>
                    <input
                      type="text"
                      id="newCategoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej: Manicura, Pedicura..."
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm"
                      disabled={isCreatingCategory}
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                      onClick={() => setIsCreateCategoryModalOpen(false)}
                      disabled={isCreatingCategory}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                    >
                      {isCreatingCategory ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Creando...
                        </>
                      ) : 'Crear categoría'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal para eliminar categoría */}
      <Transition appear show={isDeleteCategoryModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteCategoryModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Eliminar categoría de servicio
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que deseas eliminar la categoría <strong>{categoryToDelete}</strong>? 
                      Esta acción no puede deshacerse.
                    </p>
                    <p className="text-sm text-red-500 mt-2">
                      Nota: Solo se pueden eliminar categorías que no tengan servicios asociados.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                      onClick={() => setIsDeleteCategoryModalOpen(false)}
                      disabled={isDeletingCategory}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDeleteCategory}
                      disabled={isDeletingCategory}
                    >
                      {isDeletingCategory ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Eliminando...
                        </>
                      ) : 'Eliminar'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 