'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarSolidIcon,
  EyeIcon as EyeSolidIcon
} from '@heroicons/react/24/solid'
import { Switch } from '@headlessui/react'
import type { Service } from '@/types'
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <TagIcon className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios</h3>
          <p className="text-sm text-gray-500 mb-6">
            Comienza creando tu primer servicio para mostrar en tu catálogo
          </p>
          <Link
            href="/rachell-admin/servicios/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <TagIcon className="h-4 w-4" />
            Crear primer servicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Grid de cards responsivo */}
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-pink-200 transition-all duration-300 overflow-hidden ${
                !service.isActive ? 'opacity-60' : ''
              } ${isLoading ? 'pointer-events-none' : ''}`}
            >
              {/* Badge de destacado */}
              {service.isHighlight && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="flex items-center gap-1 px-2 py-1 bg-pink-500 text-white text-xs font-medium rounded-full">
                    <StarSolidIcon className="h-3 w-3" />
                    Destacado
                  </div>
                </div>
              )}

              {/* Badge de estado */}
              <div className="absolute top-3 right-3 z-10">
                <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                  service.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {service.isActive ? (
                    <>
                      <EyeSolidIcon className="h-3 w-3" />
                      Activo
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-3 w-3" />
                      Inactivo
                    </>
                  )}
                </div>
              </div>

              {/* Imagen del servicio */}
              <div className="relative h-48 bg-gradient-to-br from-pink-50 to-pink-100">
                {service.images && service.images[0] ? (
                  <Image
                    src={service.images[0].url}
                    alt={service.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center">
                      <TagIcon className="h-12 w-12 text-pink-300 mx-auto mb-2" />
                      <span className="text-sm text-pink-400">Sin imagen</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Contenido del card */}
              <div className="p-5">
                {/* Header */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Información del servicio */}
                <div className="space-y-2 mb-4">
                  {/* Precio */}
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                    <div className="flex items-baseline gap-2">
                      {service.offerPrice ? (
                        <>
                          <span className="text-lg font-bold text-pink-600">
                            ${Number(service.offerPrice).toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ${Number(service.price).toLocaleString()}
                          </span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                            -{Math.round(((Number(service.price) - Number(service.offerPrice)) / Number(service.price)) * 100)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          ${Number(service.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duración */}
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {service.duration.includes(':') 
                        ? service.duration.split(':').map((part: string, index: number) => {
                            const value = parseInt(part);
                            if (index === 0 && value > 0) return `${value}h `;
                            if (index === 1 && value > 0) return `${value}min`;
                            if (index === 1 && value === 0 && parseInt(service.duration.split(':')[0]) > 0) return '';
                            return '';
                          }).join('')
                        : `${service.duration}min`
                      }
                    </span>
                  </div>

                  {/* Categoría */}
                  {service.category && (
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{service.category.name}</span>
                    </div>
                  )}
                </div>

                {/* Controles */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  {/* Switches */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Switch Activo */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Activo</span>
                        <Switch
                          checked={service.isActive}
                          onChange={() => handleToggleActive(service)}
                          disabled={isLoading}
                          className={`${
                            service.isActive ? 'bg-pink-600' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50`}
                        >
                          <span
                            className={`${
                              service.isActive ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      {/* Switch Destacado */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Destacado</span>
                        <Switch
                          checked={service.isHighlight}
                          onChange={() => handleToggleHighlight(service)}
                          disabled={isLoading}
                          className={`${
                            service.isHighlight ? 'bg-yellow-500' : 'bg-gray-200'
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50`}
                        >
                          <span
                            className={`${
                              service.isHighlight ? 'translate-x-5' : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/rachell-admin/servicios/${service.id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(service)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setServiceToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Servicio"
        message={`¿Estás seguro de que deseas eliminar el servicio "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}