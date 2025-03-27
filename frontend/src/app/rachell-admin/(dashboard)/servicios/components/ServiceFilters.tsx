'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Switch } from '@headlessui/react'
import { useCategories } from '@/hooks/useCategories'

interface ServiceFiltersProps {
  onFilterChange: (filters: any) => void
  isLoading?: boolean
}

export default function ServiceFilters({ onFilterChange, isLoading }: ServiceFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    isActive: true,
    isHighlight: false,
    hasOffer: false,
    categoryId: ''
  })
  
  const { categories, isLoadingCategories } = useCategories()

  // Efecto para notificar cambios en los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Solo enviar categoryId si no está vacío
      const filtersToSend = {
        ...filters,
        categoryId: filters.categoryId || undefined
      }
      onFilterChange(filtersToSend)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, onFilterChange])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    console.log('Categoría seleccionada:', value)
    setFilters(prev => ({ ...prev, categoryId: value }))
  }

  return (
    <div className="border-b border-gray-900/5">
      <div className="p-4 sm:p-6 space-y-4">
        {/* Búsqueda y categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={filters.search}
              onChange={handleSearchChange}
              autoComplete="off"
              spellCheck="false"
              disabled={isLoading}
              className="block w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              placeholder="Buscar por nombre o descripción..."
            />
          </div>

          <div>
            <select
              id="category"
              name="category"
              value={filters.categoryId}
              onChange={handleCategoryChange}
              disabled={isLoading || isLoadingCategories}
              className="block w-full rounded-xl border-0 py-3.5 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-pink-500 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-white"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros de toggle */}
        <div className="flex flex-wrap items-center gap-6 py-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.isActive}
              onChange={(checked) => setFilters(prev => ({ ...prev, isActive: checked }))}
              disabled={isLoading}
              className={`${
                filters.isActive ? 'bg-pink-500' : 'bg-gray-200'
              } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="sr-only">Mostrar activos</span>
              <span
                className={`${
                  filters.isActive ? 'translate-x-4' : 'translate-x-0'
                } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
            <span className="text-sm font-medium text-gray-700">Solo activos</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={filters.isHighlight}
              onChange={(checked) => setFilters(prev => ({ ...prev, isHighlight: checked }))}
              disabled={isLoading}
              className={`${
                filters.isHighlight ? 'bg-pink-500' : 'bg-gray-200'
              } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="sr-only">Mostrar destacados</span>
              <span
                className={`${
                  filters.isHighlight ? 'translate-x-4' : 'translate-x-0'
                } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
            <span className="text-sm font-medium text-gray-700">Destacados</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={filters.hasOffer}
              onChange={(checked) => setFilters(prev => ({ ...prev, hasOffer: checked }))}
              disabled={isLoading}
              className={`${
                filters.hasOffer ? 'bg-pink-500' : 'bg-gray-200'
              } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="sr-only">Mostrar ofertas</span>
              <span
                className={`${
                  filters.hasOffer ? 'translate-x-4' : 'translate-x-0'
                } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
            <span className="text-sm font-medium text-gray-700">Con oferta</span>
          </div>
        </div>
      </div>
    </div>
  )
} 