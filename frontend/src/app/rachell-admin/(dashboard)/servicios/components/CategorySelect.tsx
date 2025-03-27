'use client'

import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/20/solid'
import { getSession } from '@/lib/auth'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
}

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function CategorySelect({ value, onChange, error, disabled }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const fetchCategories = async () => {
    try {
      const session = await getSession()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (!response.ok) throw new Error('Error al cargar las categorías')
      const data = await response.json()
      setCategories(data)
      
      // Si hay un valor seleccionado, encontrar la categoría correspondiente
      if (value) {
        const category = data.find((cat: Category) => cat.id === value)
        if (category) setSelectedCategory(category)
      }
    } catch (error) {
      console.error('Error al cargar las categorías:', error)
      toast.error('Error al cargar las categorías')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [value])

  const handleChange = (category: Category) => {
    setSelectedCategory(category)
    onChange(category.id)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    try {
      const session = await getSession()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name: newCategoryName })
      })

      if (!response.ok) {
        throw new Error('Error al crear la categoría')
      }

      const newCategory = await response.json()
      
      // Actualizar la lista de categorías
      await fetchCategories()
      
      // Seleccionar la nueva categoría
      setSelectedCategory(newCategory)
      onChange(newCategory.id)
      
      // Limpiar el formulario
      setNewCategoryName('')
      setIsAddingCategory(false)
      toast.success('Categoría creada correctamente')
    } catch (error) {
      console.error('Error al crear la categoría:', error)
      toast.error('Error al crear la categoría')
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
  }

  return (
    <div className="space-y-4">
      <div className="relative mt-2">
        <Listbox value={selectedCategory} onChange={handleChange} disabled={disabled}>
          <div className="relative">
            <Listbox.Button className={`relative w-full cursor-default rounded-md bg-white py-2.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
              error 
                ? 'ring-red-300 focus:ring-red-500' 
                : 'ring-gray-300 focus:ring-pink-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className="block truncate">
                {selectedCategory ? selectedCategory.name : 'Selecciona una categoría'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {categories.map((category) => (
                  <Listbox.Option
                    key={category.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-pink-100 text-pink-900' : 'text-gray-900'
                      }`
                    }
                    value={category}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {category.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {!isAddingCategory ? (
        <button
          type="button"
          onClick={() => setIsAddingCategory(true)}
          className="inline-flex items-center gap-x-1.5 text-sm font-semibold text-pink-600 hover:text-pink-500"
        >
          <PlusIcon className="h-5 w-5" />
          Agregar nueva categoría
        </button>
      ) : (
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-600 sm:text-sm sm:leading-6"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(false)
                setNewCategoryName('')
              }}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 