'use client'

import { useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import ServiceFilters from './components/ServiceFilters'
import ServiceList from './components/ServiceList'
import { useServices } from './hooks/useServices'
import type { Service } from './types'
import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ServicesPage() {
  const { 
    services, 
    isLoading, 
    error, 
    fetchServices,
    updateService,
    deleteService
  } = useServices()

  useEffect(() => {
    fetchServices({})
  }, [fetchServices])

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Servicios
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los servicios que ofreces en tu negocio
          </p>
        </div>
        <Link
          href="/rachell-admin/servicios/nuevo"
          className="group relative inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 outline-none transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/35 hover:from-pink-600 hover:via-pink-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-2 active:scale-[0.98] w-full sm:w-auto"
        >
          <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-pink-500/25 to-pink-600/25 blur-lg transition-all duration-300 group-hover:blur-xl"></span>
          <PlusIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180 group-hover:scale-110" />
          <span className="relative">Nuevo servicio</span>
        </Link>
      </div>

      {/* Contenedor principal con sombra y fondo */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <ServiceFilters 
            onFilterChange={fetchServices} 
            isLoading={isLoading}
          />
          <ServiceList 
            services={services} 
            onUpdateService={updateService} 
            onDeleteService={deleteService} 
          />
        </Suspense>
      </div>
    </div>
  )
} 