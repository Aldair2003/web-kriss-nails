import { useState, useCallback, useRef, useEffect } from 'react'
import type { Image, ImageType } from '../types'
import { getSession, authenticatedFetch } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001')

interface FetchImagesParams {
  type?: ImageType;
  category?: string;
  serviceId?: string;
  isActive?: boolean;
  isHighlight?: boolean;
  page?: number;
  limit?: number;
}

interface UseImagesReturn {
  images: Image[];
  isLoading: boolean;
  error: Error | null;
  fetchImages: (params: FetchImagesParams) => Promise<void>;
  updateImage: (id: string, data: Partial<Image>) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
}

export function useImages(): UseImagesReturn {
  const [images, setImages] = useState<Image[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchImages = useCallback(async (params: FetchImagesParams = {}) => {
    try {
      // Cancelar la petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo controlador para esta petición
      abortControllerRef.current = new AbortController()
      
      setIsLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/images?${queryParams}`,
        {
          signal: abortControllerRef.current.signal
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al obtener las imágenes')
      }

      const data = await response.json()
      setImages(data)
    } catch (error) {
      // Ignorar errores de abort
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      console.error('Error en fetchImages:', error)
      setError(error instanceof Error ? error : new Error('Error desconocido'))
    } finally {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      setIsLoading(false)
    }
  }, [])

  // Limpiar el controlador al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const updateImage = useCallback(async (id: string, data: Partial<Image>) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authenticatedFetch(`${API_BASE_URL}/api/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al actualizar la imagen')
      }

      const updatedImage = await response.json()
      setImages(images => images.map(image => 
        image.id === id ? updatedImage : image
      ))
    } catch (error) {
      console.error('Error al actualizar imagen:', error)
      setError(error instanceof Error ? error : new Error('Error desconocido'))
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteImage = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authenticatedFetch(`${API_BASE_URL}/api/images/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la imagen')
      }

      setImages(images => images.filter(image => image.id !== id))
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Error desconocido'))
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    images,
    isLoading,
    error,
    fetchImages,
    updateImage,
    deleteImage,
  }
} 