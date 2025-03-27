'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { ServiceFormData, Service } from '../types'
import { getSession } from '@/lib/auth'

const ServiceForm = dynamic(() => import('../components/ServiceForm'), {
  loading: () => (
    <div className="animate-pulse space-y-8">
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  ),
  ssr: false
})

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function NewServicePage() {
  const router = useRouter()

  const handleSubmit = async (data: ServiceFormData): Promise<Service> => {
    try {
      const session = await getSession()
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear el servicio')
      }

      const createdService = await response.json()
      return createdService
    } catch (error) {
      console.error('Error:', error)
      throw error instanceof Error ? error : new Error('Error al crear el servicio')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header con botón de regresar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-x-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Volver a servicios
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Nuevo Servicio
            </h1>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-6 sm:p-8">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                Información del servicio
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Completa la información necesaria para crear un nuevo servicio en tu catálogo.
              </p>
            </div>
          </div>

          <Suspense fallback={
            <div className="space-y-8">
              <div className="animate-pulse bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
              <div className="animate-pulse bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          }>
            <ServiceForm onSubmit={handleSubmit} />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 