'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageType } from '../types';
import { debounce } from 'lodash';

interface Service {
  id: string;
  name: string;
}

interface ImageFiltersProps {
  onFilterChange: (filters: { 
    type?: ImageType, 
    category?: string, 
    serviceId?: string,
    isActive?: boolean
  }) => void;
  isLoading: boolean;
  services?: Service[];
}

export default function ImageFilters({ onFilterChange, isLoading, services = [] }: ImageFiltersProps) {
  const [type, setType] = useState<ImageType | ''>('');
  const [category, setCategory] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [isActive, setIsActive] = useState<boolean | ''>('');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Asegurar que services sea un array válido
  const validServices = Array.isArray(services) ? services : [];

  // Debounce para la búsqueda
  const debouncedFilterChange = useCallback(
    debounce((filters: any) => {
      onFilterChange(filters);
      setIsFiltering(false);
    }, 300),
    [onFilterChange]
  );

  const handleFilterChange = () => {
    setIsFiltering(true);
    const filters: { 
      type?: ImageType, 
      category?: string,
      serviceId?: string,
      isActive?: boolean 
    } = {};

    if (type) filters.type = type;
    if (category.trim()) filters.category = category.trim();
    if (serviceId) filters.serviceId = serviceId;
    if (isActive !== '') filters.isActive = isActive;

    console.log('Enviando filtros:', filters);
    debouncedFilterChange(filters);
  };

  // Aplicar filtros automáticamente cuando cambien los valores
  useEffect(() => {
    handleFilterChange();
  }, [type, category, serviceId, isActive]);

  const handleReset = () => {
    setType('');
    setCategory('');
    setServiceId('');
    setIsActive('');
    setIsFiltering(false);
    console.log('Limpiando filtros');
    onFilterChange({});
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 sm:p-6 transition-all duration-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {/* Filtro por tipo */}
        <div className="w-full transition-all duration-200">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as ImageType | '');
              if (!e.target.value) {
                setServiceId('');
              }
            }}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm transition-colors duration-200 hover:border-pink-400"
            disabled={isLoading}
          >
            <option value="">Todos</option>
            <option value="GALLERY">Galería</option>
            <option value="BEFORE_AFTER">Antes/Después</option>
            <option value="SERVICE">Servicios</option>
          </select>
        </div>

        {/* Filtro por categoría */}
        <div className="w-full transition-all duration-200">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Acrílicas, Nail Art..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm transition-colors duration-200 hover:border-pink-400"
            disabled={isLoading}
          />
        </div>

        {/* Filtro por servicio */}
        {validServices.length > 0 && (
          <div className="w-full transition-all duration-200">
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <select
              id="service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm transition-colors duration-200 hover:border-pink-400"
              disabled={isLoading}
            >
              <option value="">Todos</option>
              {validServices.map(service => (
                service && typeof service === 'object' && service.id && service.name ? (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ) : null
              ))}
            </select>
          </div>
        )}

        {/* Filtro por estado */}
        <div className="w-full transition-all duration-200">
          <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="isActive"
            value={isActive === '' ? '' : String(isActive)}
            onChange={(e) => {
              const value = e.target.value;
              setIsActive(value === '' ? '' : value === 'true');
            }}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm transition-colors duration-200 hover:border-pink-400"
            disabled={isLoading}
          >
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        {/* Botón de reset */}
        <div className="flex items-end w-full">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Indicador de estado */}
      {(isFiltering || isLoading) && (
        <div className="mt-4 text-sm text-gray-500 animate-pulse text-center sm:text-left">
          Actualizando resultados...
        </div>
      )}
    </div>
  );
} 