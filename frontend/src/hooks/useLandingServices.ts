import { useState, useCallback } from 'react'
import type { Service } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ServicesByCategory {
  [key: string]: {
    categoryName: string
    items: Service[]
  }
}

interface UseLandingServicesReturn {
  services: Service[]
  servicesByCategory: ServicesByCategory
  isLoading: boolean
  error: Error | null
  fetchServices: () => Promise<void>
}

export function useLandingServices(): UseLandingServicesReturn {
  const [services, setServices] = useState<Service[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener servicios activos y ordenados
      const response = await fetch(`${API_BASE_URL}/api/services?isActive=true`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los servicios')
      }

      const data = await response.json()
      const activeServices = data.services || []

      // Ordenar: destacados primero
      const sortedServices = [...activeServices].sort((a, b) => {
        if (a.isHighlight && !b.isHighlight) return -1
        if (!a.isHighlight && b.isHighlight) return 1
        return 0
      })

      setServices(sortedServices)

      // Agrupar por categorías
      const grouped = sortedServices.reduce((acc: ServicesByCategory, service: Service) => {
        const categoryId = service.categoryId
        const categoryName = service.category?.name || 'Sin categoría'

        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryName,
            items: []
          }
        }

        acc[categoryId].items.push(service)
        return acc
      }, {})

      setServicesByCategory(grouped)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setError(error)
      console.error('Error al cargar servicios:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    services,
    servicesByCategory,
    isLoading,
    error,
    fetchServices
  }
} 