import { useState, useCallback, useRef, useEffect } from 'react'
import type { Service } from '../types/index'
import { getSession, authenticatedFetch } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001')

interface FetchServicesParams {
  categoryId?: string
  isActive?: boolean
  isHighlight?: boolean
  hasOffer?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface UseServicesReturn {
  services: Service[]
  isLoading: boolean
  error: Error | null
  fetchServices: (params: FetchServicesParams) => Promise<void>
  updateService: (id: string, data: Partial<Service>) => Promise<void>
  deleteService: (id: string) => Promise<void>
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchServices = useCallback(async (params: FetchServicesParams) => {
    try {
      // Cancelar la petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo controlador para esta petición
      abortControllerRef.current = new AbortController()

      console.log('Iniciando fetchServices con parámetros:', params)
      
      // Solo establecer loading si no es una búsqueda
      if (!params.search) {
        setIsLoading(true)
      }
      
      setError(null)

      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })

      console.log('URL de la petición:', `${API_BASE_URL}/api/services?${queryParams}`)

      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/services?${queryParams}`,
        {
          signal: abortControllerRef.current.signal
        }
      )

      console.log('Estado de la respuesta:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error en la respuesta:', errorData)
        throw new Error(errorData.message || 'Error al obtener los servicios')
      }

      const data = await response.json()
      console.log('Datos recibidos:', data)
      
      setServices(data.services)
    } catch (error) {
      // Ignorar errores de abort
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      console.error('Error en fetchServices:', error)
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

  const updateService = useCallback(async (id: string, data: Partial<Service>) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authenticatedFetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al actualizar el servicio')
      }

      const updatedService = await response.json()
      setServices(services => services.map(service => 
        service.id === id ? updatedService : service
      ))
    } catch (error) {
      console.error('Error al actualizar servicio:', error)
      setError(error instanceof Error ? error : new Error('Error desconocido'))
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteService = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authenticatedFetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el servicio')
      }

      setServices(services => services.filter(service => service.id !== id))
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Error desconocido'))
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    services,
    isLoading,
    error,
    fetchServices,
    updateService,
    deleteService,
  }
} 