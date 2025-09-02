'use client'

import { useState, useCallback } from 'react'
import { getSession } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001')

interface Category {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

interface UseCategoriesReturn {
  categories: Category[]
  isLoading: boolean
  error: Error | null
  fetchCategories: () => Promise<void>
  addCategory: (name: string) => Promise<Category>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const session = await getSession()
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cargar las categorías')
      }
      
      const data = await response.json()
      setCategories(data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setError(error)
      console.error('Error al cargar categorías:', error)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addCategory = useCallback(async (name: string): Promise<Category> => {
    try {
      const session = await getSession()
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear la categoría')
      }

      const newCategory = await response.json()
      
      // Actualizar la lista de categorías
      setCategories(prev => [...prev, newCategory])
      
      return newCategory
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al crear la categoría')
      console.error('Error al crear categoría:', error)
      throw error
    }
  }, [])

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    addCategory
  }
} 