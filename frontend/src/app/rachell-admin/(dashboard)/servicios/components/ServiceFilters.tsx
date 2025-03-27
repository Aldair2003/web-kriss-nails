'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline'
import { Switch } from '@headlessui/react'
import { useCategories } from '@/hooks/useCategories'

interface ServiceFiltersProps {
  onFilterChange: (filters: any) => void
  isLoading?: boolean
}

export default function ServiceFilters({ onFilterChange, isLoading }: ServiceFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    isActive: false,
    isHighlight: false,
    hasOffer: false,
    categoryId: ''
  })
  
  const [showAll, setShowAll] = useState(true)
  const { categories, isLoadingCategories } = useCategories()

  // Efecto para notificar cambios en los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Si showAll está activo, enviamos undefined para todos los filtros booleanos
      const filtersToSend = {
        ...filters,
        categoryId: filters.categoryId || undefined,
        isActive: showAll ? undefined : filters.isActive,
        isHighlight: showAll ? undefined : filters.isHighlight,
        hasOffer: showAll ? undefined : filters.hasOffer
      }
      onFilterChange(filtersToSend)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, showAll, onFilterChange])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
    setShowAll(false)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFilters(prev => ({ ...prev, categoryId: value }))
    setShowAll(false)
  }

  const handleShowAllClick = () => {
    // Si ya está activo, lo desactivamos y restauramos los filtros por defecto
    if (showAll) {
      setShowAll(false)
      setFilters(prev => ({
        ...prev,
        isActive: false,
        isHighlight: false,
        hasOffer: false
      }))
    } else {
      setShowAll(true)
      setFilters(prev => ({
        ...prev,
        isActive: false,
        isHighlight: false,
        hasOffer: false
      }))
    }
  }

  const handleSwitchChange = (field: string, checked: boolean) => {
    setShowAll(false)
    setFilters(prev => ({ ...prev, [field]: checked }))
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

        {/* Filtros de toggle y botón Mostrar todo */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-2">
          <button
            onClick={handleShowAllClick}
            disabled={isLoading}
            className={`group relative inline-flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto mb-2 sm:mb-0 ${
              showAll 
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/35' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ViewfinderCircleIcon className={`h-5 w-5 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
            <span>Mostrar todo</span>
            {showAll && (
              <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-pink-500/25 to-pink-600/25 blur-lg"></span>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 min-w-[120px]">
              <Switch
                checked={filters.isActive}
                onChange={(checked) => handleSwitchChange('isActive', checked)}
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
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Solo activos</span>
            </div>

            <div className="flex items-center gap-2 min-w-[120px]">
              <Switch
                checked={filters.isHighlight}
                onChange={(checked) => handleSwitchChange('isHighlight', checked)}
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
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Destacados</span>
            </div>

            <div className="flex items-center gap-2 min-w-[120px]">
              <Switch
                checked={filters.hasOffer}
                onChange={(checked) => handleSwitchChange('hasOffer', checked)}
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
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Con oferta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 