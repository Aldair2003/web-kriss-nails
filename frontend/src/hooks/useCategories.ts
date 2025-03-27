import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'

interface Category {
  id: string
  name: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        setError(null)

        const response = await authenticatedFetch(`${API_BASE_URL}/api/categories`)
        
        if (!response.ok) {
          throw new Error('Error al cargar las categorías')
        }

        const data = await response.json()
        setCategories(data)
      } catch (err) {
        console.error('Error al cargar categorías:', err)
        setError(err instanceof Error ? err : new Error('Error desconocido'))
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    isLoadingCategories,
    error
  }
} 