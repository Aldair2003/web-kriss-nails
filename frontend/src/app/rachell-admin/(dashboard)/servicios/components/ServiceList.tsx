'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Switch } from '@headlessui/react'
import type { Service } from '../types'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface ServiceListProps {
  services: Service[]
  isLoading?: boolean
  onUpdateService: (id: string, data: Partial<Service>) => Promise<void>
  onDeleteService: (id: string) => Promise<void>
}

export default function ServiceList({ 
  services, 
  isLoading,
  onUpdateService,
  onDeleteService 
}: ServiceListProps) {
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleToggleActive = async (service: Service) => {
    try {
      await onUpdateService(service.id, { isActive: !service.isActive })
    } catch (error) {
      console.error('Error al actualizar el estado del servicio:', error)
    }
  }

  const handleToggleHighlight = async (service: Service) => {
    try {
      await onUpdateService(service.id, { isHighlight: !service.isHighlight })
    } catch (error) {
      console.error('Error al actualizar el destacado del servicio:', error)
    }
  }

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return
    
    try {
      await onDeleteService(serviceToDelete.id)
      setServiceToDelete(null)
    } catch (error) {
      console.error('Error al eliminar el servicio:', error)
    }
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <p className="mt-1 text-sm text-gray-500">
            No hay servicios que mostrar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-root">
      {/* Vista móvil */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-1 gap-4 p-4">
          {services.map((service) => (
            <div 
              key={service.id}
              className={`bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 overflow-hidden ${isLoading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start">
                <div className="relative h-24 w-24 flex-shrink-0">
                  {service.images && service.images[0] ? (
                    <Image
                      src={service.images[0].url}
                      alt={service.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                      priority
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">{service.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {service.duration.includes(':') 
                          ? service.duration.split(':').map((part, index) => {
                              const value = parseInt(part);
                              if (index === 0 && value > 0) return `${value}h `;
                              if (index === 1 && value > 0) return `${value}min`;
                              if (index === 1 && value === 0 && parseInt(service.duration.split(':')[0]) > 0) return '';
                              return '';
                            }).join('')
                          : `${service.duration}min`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/rachell-admin/servicios/${service.id}/edit`}
                        className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all duration-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(service)}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500/10 to-pink-500/5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                      <span className="text-xs font-medium text-pink-700">{service.category?.name || 'Sin categoría'}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${typeof service.price === 'string' ? parseFloat(service.price).toFixed(2) : service.price.toFixed(2)}
                      {service.hasOffer && service.offerPrice && (
                        <span className="ml-1.5 text-xs font-medium text-green-600">
                          ${typeof service.offerPrice === 'string' ? parseFloat(service.offerPrice).toFixed(2) : service.offerPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onChange={() => handleToggleActive(service)}
                        disabled={isLoading}
                        className={`${
                          service.isActive ? 'bg-green-500' : 'bg-gray-200'
                        } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="sr-only">Cambiar estado</span>
                        <span
                          className={`${
                            service.isActive ? 'translate-x-4' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </Switch>
                      <span className="text-xs text-gray-500">Activo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isHighlight}
                        onChange={() => handleToggleHighlight(service)}
                        disabled={isLoading}
                        className={`${
                          service.isHighlight ? 'bg-pink-500' : 'bg-gray-200'
                        } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="sr-only">Cambiar destacado</span>
                        <span
                          className={`${
                            service.isHighlight ? 'translate-x-4' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </Switch>
                      <span className="text-xs text-gray-500">Destacado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vista desktop */}
      <div className="hidden sm:block">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:pl-6 w-[40%]">
                  Servicio
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[15%]">
                  Categoría
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[15%]">
                  Precio
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[15%]">
                  Estado
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[15%]">
                  Destacado
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {services.map((service) => (
                <tr 
                  key={service.id} 
                  className={`${isLoading ? 'opacity-50' : ''} hover:bg-gray-50 transition-colors duration-200`}
                >
                  <td className="py-4 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden">
                        {service.images && service.images[0] ? (
                          <Image
                            src={service.images[0].url}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            priority
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Sin imagen</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[200px]">{service.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {service.duration.includes(':') 
                            ? service.duration.split(':').map((part, index) => {
                                const value = parseInt(part);
                                if (index === 0 && value > 0) return `${value}h `;
                                if (index === 1 && value > 0) return `${value}min`;
                                if (index === 1 && value === 0 && parseInt(service.duration.split(':')[0]) > 0) return '';
                                return '';
                              }).join('')
                            : `${service.duration}min`
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500/10 to-pink-500/5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                      <span className="text-xs font-medium text-pink-700">{service.category?.name || 'Sin categoría'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${typeof service.price === 'string' ? parseFloat(service.price).toFixed(2) : service.price.toFixed(2)}
                    </div>
                    {service.hasOffer && service.offerPrice && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-xs font-medium text-green-600">
                          ${typeof service.offerPrice === 'string' ? parseFloat(service.offerPrice).toFixed(2) : service.offerPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <Switch
                      checked={service.isActive}
                      onChange={() => handleToggleActive(service)}
                      disabled={isLoading}
                      className={`${
                        service.isActive ? 'bg-green-500' : 'bg-gray-200'
                      } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="sr-only">Cambiar estado</span>
                      <span
                        className={`${
                          service.isActive ? 'translate-x-4' : 'translate-x-0'
                        } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </td>
                  <td className="px-3 py-4">
                    <Switch
                      checked={service.isHighlight}
                      onChange={() => handleToggleHighlight(service)}
                      disabled={isLoading}
                      className={`${
                        service.isHighlight ? 'bg-pink-500' : 'bg-gray-200'
                      } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="sr-only">Cambiar destacado</span>
                      <span
                        className={`${
                          service.isHighlight ? 'translate-x-4' : 'translate-x-0'
                        } pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </td>
                  <td className="py-4 pl-3 pr-4 text-right sm:pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/rachell-admin/servicios/${service.id}/edit`}
                        className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all duration-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Editar {service.name}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(service)}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Eliminar {service.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setServiceToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar servicio"
        message={`¿Estás seguro de que deseas eliminar el servicio "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
} 