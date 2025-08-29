'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { getImageById, updateImage } from '@/services/image-service';
import { Image as ImageModel, ImageType } from '../../types';

interface EditarImagenClientProps {
  imageId: string;
}

export default function EditarImagenClient({ imageId }: EditarImagenClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<ImageModel | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isHighlight, setIsHighlight] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Intentando cargar imagen con ID:', imageId);

        const data = await getImageById(imageId);
        console.log('Datos de imagen recibidos:', data);

        setImage(data);
        // Inicializar estados del formulario
        if (data.type === 'SERVICE') {
          // Si es un servicio visual, usar los campos correspondientes
          console.log('Datos completos de la imagen:', data);
          
          // Usar displayServiceName y displayServiceCategory si existen
          if (data.displayServiceName !== undefined) {
            console.log('Usando displayServiceName:', data.displayServiceName);
            setTitle(data.displayServiceName);
          } else {
            console.log('Usando title como respaldo:', data.title);
            setTitle(data.title || '');
          }

          if (data.displayServiceCategory !== undefined) {
            console.log('Usando displayServiceCategory:', data.displayServiceCategory);
            setCategory(data.displayServiceCategory);
          } else {
            console.log('Usando category como respaldo:', data.category);
            setCategory(data.category || '');
          }
        } else {
          // Para otros tipos de imágenes
          setTitle(data.title || '');
          setCategory(data.category || '');
        }
        setIsHighlight(data.isHighlight || false);

      } catch (err) {
        console.error('Error al cargar la imagen:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la imagen');
        toast.error('Error al cargar la imagen');
      } finally {
        setLoading(false);
      }
    };

    if (imageId) {
      fetchImage();
    }
  }, [imageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const updatedData: Partial<ImageModel> = {
        isHighlight
      };

      // Si es un servicio visual, actualizar los campos display
      if (image?.type === 'SERVICE') {
        console.log('Actualizando servicio visual:', { title, category });
        updatedData.displayServiceName = title;
        updatedData.displayServiceCategory = category;
        // También actualizamos los campos normales como respaldo
        updatedData.title = title;
        updatedData.category = category;
      } else {
        // Para otros tipos de imágenes
        updatedData.title = title;
        updatedData.category = category;
      }

      console.log('Enviando actualización:', updatedData);

      await updateImage(imageId, updatedData);

      toast.success('Imagen actualizada correctamente');
      router.push('/rachell-admin/galeria');
      router.refresh();

    } catch (err) {
      console.error('Error al actualizar:', err);
      toast.error('Error al actualizar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHighlight = async () => {
    try {
      setLoading(true);
      const newHighlightState = !isHighlight;
      
      await updateImage(imageId, {
        isHighlight: newHighlightState
      });

      setIsHighlight(newHighlightState);
      toast.success(newHighlightState ? 'Imagen destacada' : 'Imagen no destacada');

    } catch (err) {
      console.error('Error al cambiar estado destacado:', err);
      toast.error('Error al cambiar estado destacado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || 'No se pudo cargar la imagen'}</p>
        <button
          onClick={() => router.back()}
          className="text-pink-500 hover:text-pink-600"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-pink-500 hover:text-pink-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver a la galería
        </button>

        <button
          onClick={handleToggleHighlight}
          disabled={loading}
          className={`p-1.5 sm:p-2 rounded-full transition-colors ${
            isHighlight 
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={isHighlight ? 'Quitar de destacados' : 'Marcar como destacada'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill={isHighlight ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Preview de la imagen */}
          <div className="w-full lg:w-1/2 relative">
            {image.type === 'BEFORE_AFTER' && image.beforeAfterPair ? (
              <div className="relative aspect-square">
                <div className="absolute inset-0 flex">
                  {/* Imagen Antes */}
                  <div className="w-1/2 relative overflow-hidden">
                    <Image
                      src={image.beforeAfterPair.before}
                      alt="Antes"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                      Antes
                    </div>
                  </div>
                  {/* Imagen Después */}
                  <div className="w-1/2 relative overflow-hidden">
                    <Image
                      src={image.beforeAfterPair.after}
                      alt="Después"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-pink-500/80 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                      Después
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.title || 'Imagen'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {image?.type === 'SERVICE' 
                    ? 'Nombre del servicio visual'
                    : 'Título'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={image?.type === 'SERVICE' ? 'Ingrese el nombre del servicio visual' : 'Ingrese el título'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {image?.type === 'SERVICE'
                    ? 'Categoría del servicio visual'
                    : 'Categoría'}
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={image?.type === 'SERVICE' ? 'Ingrese la categoría del servicio visual' : 'Ingrese la categoría'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm sm:text-base"
                />
              </div>

              <div className="pt-2 sm:pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 sm:py-2.5 px-4 rounded-md hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-all duration-200"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 