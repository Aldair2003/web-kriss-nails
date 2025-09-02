// @ts-nocheck

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Switch } from '@headlessui/react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CategorySelect } from './CategorySelect'
import { ImageUploader } from './ImageUploader'
import type { ServiceFormData, ServiceFormState, Service } from '../types/index'
import { getSession } from '@/lib/auth'
import { toast } from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001')

const formStateSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.string()
    .min(1, 'El precio es requerido'),
  hours: z.number().min(0, 'Las horas no pueden ser negativas'),
  minutes: z.number().min(0, 'Los minutos no pueden ser negativos').max(59, 'Los minutos deben ser menores a 60'),
  categoryId: z.string().min(1, 'Debes seleccionar una categoría'),
  isActive: z.boolean().default(true),
  isHighlight: z.boolean().default(false),
  hasOffer: z.boolean().default(false),
  offerPrice: z.string()
    .optional(),
  images: z.array(z.object({
    id: z.string(),
    url: z.string()
  })).default([])
})

const serviceSchema = formStateSchema.transform((data): ServiceFormData => {
  // Convertir horas y minutos a formato HH:MM
  const hours = data.hours.toString().padStart(2, '0')
  const minutes = data.minutes.toString().padStart(2, '0')
  const duration = `${hours}:${minutes}`

  // Convertir price y offerPrice a números
  const price = parseFloat(data.price)
  if (isNaN(price)) throw new Error('El precio debe ser un número válido')
  if (price < 0) throw new Error('El precio no puede ser negativo')

  let offerPrice: number | undefined = undefined
  if (data.hasOffer && data.offerPrice) {
    offerPrice = parseFloat(data.offerPrice)
    if (isNaN(offerPrice)) throw new Error('El precio de oferta debe ser un número válido')
    if (offerPrice < 0) throw new Error('El precio de oferta no puede ser negativo')
    if (offerPrice >= price) throw new Error('El precio de oferta debe ser menor al precio regular')
  }

  // Eliminar los campos hours y minutes del objeto final
  const { hours: _, minutes: __, price: ___, offerPrice: ____, ...rest } = data
  
  return {
    ...rest,
    price,
    duration,
    ...(offerPrice !== undefined && { offerPrice })
  }
})

interface ServiceFormProps {
  initialData?: Service
  isLoading?: boolean
  onSubmit: (data: ServiceFormData) => Promise<Service>
}

interface Category {
  id: number
  name: string
}

// Hook personalizado para manejar las categorías
const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const session = await getSession()
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        })
        if (!response.ok) throw new Error('Error al cargar las categorías')
        const data = await response.json()
        setCategories(data)
      } catch (err) {
        setCategoriesError(err instanceof Error ? err.message : 'Error desconocido al cargar las categorías')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, isLoading: isLoadingCategories, error: categoriesError }
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onSubmit, initialData }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors } 
  } = useForm<ServiceFormState>({
    resolver: zodResolver(formStateSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price?.toString() || '',
      hours: initialData?.duration ? parseInt(initialData.duration.split(':')[0]) : 1,
      minutes: initialData?.duration ? parseInt(initialData.duration.split(':')[1]) : 0,
      categoryId: initialData?.categoryId || '',
      isActive: initialData?.isActive ?? true,
      isHighlight: initialData?.isHighlight ?? false,
      hasOffer: initialData?.hasOffer ?? false,
      offerPrice: initialData?.offerPrice?.toString() || '',
      images: initialData?.images || []
    }
  })

  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()

  const handleImagesChange = useCallback((files: File[]) => {
    // Usar una función de actualización de estado para evitar problemas de renderizado
    requestAnimationFrame(() => {
      setSelectedFiles(files)
    })
  }, [])

  const handleSubmitForm = async (data: ServiceFormState) => {
    console.log('🚀 Iniciando handleSubmitForm con datos:', data)
    
    if (isLoading || isSaving) {
      console.log('❌ Formulario ya está enviándose o cargando, cancelando envío')
      return
    }

    setIsSaving(true)
    const loadingToast = toast.loading('Validando formulario...')

    try {
      // 1. Validar todos los campos primero
      console.log('🔍 Validando campos del formulario...')
      const validationResult = formStateSchema.safeParse(data)
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors
        console.log('❌ Errores de validación encontrados:', errors)
        
        const missingFields = errors.map(error => {
          const fieldId = error.path[0].toString()
          return labels[fieldId] || fieldId
        })
        console.log('📝 Campos faltantes:', missingFields)
        
        toast.dismiss(loadingToast)
        toast.error(`Por favor completa los siguientes campos: ${missingFields.join(', ')}`)

        // Scroll al primer campo con error
        for (const error of errors) {
          const fieldId = error.path[0].toString()
          console.log('🔍 Buscando campo con error:', fieldId)
          
          const errorField = document.getElementById(fieldId) || 
                           document.querySelector(`[name="${fieldId}"]`)
          
          if (errorField) {
            const container = errorField.closest('.bg-white') || errorField
            const rect = container.getBoundingClientRect()
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              console.log('📜 Haciendo scroll al campo:', fieldId)
              container.scrollIntoView({ behavior: 'smooth', block: 'center' })
              try {
                errorField.focus()
              } catch (e) {
                console.log('⚠️ No se pudo dar foco al campo:', fieldId)
              }
              break
            }
          }
        }
        setIsSaving(false)
        return
      }

      // 2. Validar precio de oferta
      if (data.hasOffer && data.offerPrice) {
        console.log('🔍 Validando precio de oferta...')
        const price = parseFloat(data.price)
        const offerPrice = parseFloat(data.offerPrice)
        if (offerPrice >= price) {
          console.log('❌ Precio de oferta inválido:', { price, offerPrice })
          toast.dismiss(loadingToast)
          toast.error('El precio de oferta debe ser menor al precio regular')
          setIsSaving(false)
          return
        }
      }

      console.log('✅ Validaciones completadas exitosamente')
      toast.dismiss(loadingToast)
      const savingToast = toast.loading('Guardando servicio...')

      try {
        let uploadedImages = []

        // 3. Si hay imágenes, subirlas primero como temporales
        if (selectedFiles.length > 0) {
          console.log('📸 Subiendo imágenes como temporales:', selectedFiles.length, 'imágenes')
          const formData = new FormData()
          selectedFiles.forEach(file => {
            console.log('📎 Agregando archivo al FormData:', file.name)
            formData.append('files', file)
          })

          console.log('🔐 Obteniendo sesión...')
          const session = await getSession()
          if (!session?.accessToken) {
            throw new Error('No hay sesión activa')
          }

          console.log('📤 Enviando petición de subida de imágenes temporales...')
          const response = await fetch(`${API_BASE_URL}/api/drive/upload/temp`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error('Error al subir las imágenes')
          }

          uploadedImages = await response.json()
          console.log('✅ Imágenes subidas exitosamente:', uploadedImages)
        }

        // 4. Crear el servicio con todas las imágenes
        console.log('📝 Preparando datos del servicio para guardar...')
        const formattedData = serviceSchema.parse({
          ...data,
          images: uploadedImages
        })
        
        console.log('💾 Guardando servicio con imágenes:', formattedData)
        const service = await onSubmit(formattedData)
        console.log('✅ Servicio guardado exitosamente:', service)
        
        toast.dismiss(savingToast)
        toast.success('Servicio guardado correctamente')
        console.log('✅ Proceso completado, redirigiendo...')
        router.push('/rachell-admin/servicios')
      } catch (error) {
        console.error('❌ Error en el proceso de guardado:', error)
        toast.dismiss(savingToast)
        toast.error(error instanceof Error ? error.message : 'Error al guardar el servicio')
      }
    } catch (error) {
      console.error('❌ Error general en el formulario:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Error al guardar el servicio')
    } finally {
      setIsSaving(false)
    }
  }

  // Etiquetas para los campos del formulario
  const labels: Record<string, string> = {
    name: 'Nombre del servicio',
    description: 'Descripción',
    price: 'Precio',
    hours: 'Duración (horas)',
    minutes: 'Duración (minutos)',
    categoryId: 'Categoría',
    offerPrice: 'Precio de oferta'
  }

  if (categoriesLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (categoriesError) {
    return <div className="text-red-500">Error al cargar las categorías: {categoriesError}</div>
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-8">
      {/* Información básica */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-6 py-4 border-b border-pink-200">
          <h3 className="text-lg font-semibold text-pink-800">Información Básica</h3>
          <p className="text-sm text-pink-600 mt-1">Detalles principales del servicio</p>
        </div>
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-12">
            {/* Nombre y Categoría en la misma fila */}
            <div className="lg:col-span-8">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del servicio *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  className={`block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset transition-all ${
                    errors.name 
                      ? 'ring-red-300 focus:ring-red-500 bg-red-50' 
                      : 'ring-gray-200 focus:ring-pink-500 bg-white hover:ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset text-sm`}
                  placeholder="Ej: Manicure Profesional"
                />
                {errors.name && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name.message}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría *
              </label>
              <CategorySelect
                value={watch('categoryId')}
                onChange={(value) => setValue('categoryId', value)}
                error={errors.categoryId?.message}
                disabled={isSaving}
              />
            </div>

            {/* Descripción en línea completa */}
            <div className="lg:col-span-12">
              <label htmlFor="description" className={`block text-sm font-medium leading-6 ${
                errors.description ? 'text-red-600' : 'text-gray-900'
              }`}>
                Descripción *
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  className={`block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.description ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-pink-600'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                  placeholder="Describe los detalles del servicio..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Precio y Duración en la misma fila */}
            <div className="lg:col-span-4">
              <label htmlFor="price" className={`block text-sm font-medium leading-6 ${
                errors.price ? 'text-red-600' : 'text-gray-900'
              }`}>
                Precio *
              </label>
              <div className="mt-2">
                <label className="block text-sm text-gray-500 mb-1">
                  Cantidad
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="price"
                    {...register('price')}
                    className={`block w-full rounded-md border-0 py-2.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ${
                      errors.price ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-pink-600'
                    } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              <label className={`block text-sm font-medium leading-6 ${
                errors.hours || errors.minutes ? 'text-red-600' : 'text-gray-900'
              }`}>
                Duración *
              </label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hours" className="block text-sm text-gray-500">
                    Horas
                  </label>
                  <input
                    type="number"
                    id="hours"
                    {...register('hours', { valueAsNumber: true })}
                    className={`block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.hours ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-pink-600'
                    } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                    min="0"
                    step="1"
                  />
                  {errors.hours && (
                    <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="minutes" className="block text-sm text-gray-500">
                    Minutos
                  </label>
                  <input
                    type="number"
                    id="minutes"
                    {...register('minutes', { valueAsNumber: true })}
                    className={`block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.minutes ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-pink-600'
                    } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                    min="0"
                    max="59"
                    step="1"
                  />
                  {errors.minutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.minutes.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opciones y estados */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <h3 className="text-base font-semibold leading-7 text-gray-900 mb-6">
            Configuración del servicio
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex items-center gap-x-3 p-6 bg-gray-50 rounded-lg h-full">
              <Switch
                checked={watch('isActive')}
                onChange={(isActive) => setValue('isActive', isActive)}
                className={`${
                  watch('isActive') ? 'bg-green-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    watch('isActive') ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
              <div>
                <span className="text-sm font-medium text-gray-900">Servicio activo</span>
                <p className="text-xs text-gray-500">El servicio estará disponible para reservas</p>
              </div>
            </div>

            <div className="flex items-center gap-x-3 p-6 bg-gray-50 rounded-lg h-full">
              <Switch
                checked={watch('isHighlight')}
                onChange={(isHighlight) => setValue('isHighlight', isHighlight)}
                className={`${
                  watch('isHighlight') ? 'bg-pink-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    watch('isHighlight') ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
              <div>
                <span className="text-sm font-medium text-gray-900">Destacar servicio</span>
                <p className="text-xs text-gray-500">El servicio aparecerá en la sección destacada</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center gap-x-3 p-6 bg-gray-50 rounded-lg">
                <Switch
                  checked={watch('hasOffer')}
                  onChange={(hasOffer) => setValue('hasOffer', hasOffer)}
                  className={`${
                    watch('hasOffer') ? 'bg-green-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      watch('hasOffer') ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </Switch>
                <div>
                  <span className="text-sm font-medium text-gray-900">Tiene oferta</span>
                  <p className="text-xs text-gray-500">Activar precio especial para este servicio</p>
                </div>
              </div>

              {watch('hasOffer') && (
                <div className="mt-4 p-6 bg-white rounded-lg border border-gray-200">
                  <label htmlFor="offerPrice" className="block text-sm font-medium leading-6 text-gray-900">
                    Precio de oferta
                  </label>
                  <div className="mt-2">
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        id="offerPrice"
                        {...register('offerPrice')}
                        className={`block w-full rounded-md border-0 py-2.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ${
                          errors.offerPrice ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-pink-600'
                        } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.offerPrice && (
                      <p className="mt-2 text-sm text-red-600">{errors.offerPrice.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <div>
            <h3 className="text-base font-semibold leading-7 text-gray-900">
              Imágenes del servicio
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Agrega imágenes que muestren el servicio. Puedes subir hasta 5 imágenes.
            </p>
            <div className="mt-6">
              <ImageUploader
                onChange={handleImagesChange}
                disabled={isSaving}
              />
              {errors.images && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.images.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-8 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || isSaving}
          className="inline-flex items-center px-8 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading || isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            'Guardar servicio'
          )}
        </button>
      </div>
    </form>
  )
}

export default ServiceForm 