'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import type { ServiceFormData, Service } from '../../types/index'
import { getSession } from '@/lib/auth'
import { toast } from 'react-hot-toast'

const ServiceForm = dynamic(() => import('../../components/ServiceForm'), {
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

interface EditServiceClientProps {
  id: string
}

export default function EditServiceClient({ id }: EditServiceClientProps) {
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoading(true)
        const session = await getSession()
        if (!session?.accessToken) {
          throw new Error('No hay sesión activa')
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar el servicio')
        }

        const data = await response.json()
        setService(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el servicio')
        console.error('Error:', err)
        toast.error('Error al cargar el servicio')
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
  }, [id])

  const handleSubmit = async (data: ServiceFormData): Promise<Service> => {
    try {
      const session = await getSession()
      if (!session?.accessToken) {
        throw new Error('No hay sesión activa')
      }

      // Si el servicio tiene imágenes existentes y no se están subiendo nuevas,
      // mantener las imágenes existentes
      const formData = {
        ...data,
        images: data.images.length > 0 ? data.images : service?.images || []
      }

      const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar el servicio')
      }

      const updatedService = await response.json()
      toast.success('Servicio actualizado correctamente')
      router.push('/rachell-admin/servicios')
      return updatedService
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el servicio')
      throw error instanceof Error ? error : new Error('Error al actualizar el servicio')
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
              Editar Servicio
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
                Modifica los detalles del servicio según sea necesario.
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
            {isLoading ? (
              <div className="animate-pulse space-y-8">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            ) : service ? (
              <ServiceForm onSubmit={handleSubmit} initialData={service} />
            ) : null}
          </Suspense>
        </div>
      </div>
    </div>
  )
} 