import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ImageUploaderProps {
  onChange: (files: File[]) => void
  maxFileSize?: number
  maxFiles?: number
  disabled?: boolean
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onChange,
  maxFileSize = 5 * 1024 * 1024, // 5MB por defecto
  maxFiles = 5, // 5 archivos por defecto
  disabled = false
}) => {
  const { toast } = useToast()
  const [previewImages, setPreviewImages] = useState<Array<{ id: string; url: string; file: File }>>([])

  const handleRemoveImage = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setPreviewImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      const removedImage = prev.find(img => img.id === id)
      if (removedImage) {
        URL.revokeObjectURL(removedImage.url)
      }
      // Notificar al padre con los archivos actualizados
      const updatedFiles = filtered.map(img => img.file)
      onChange(updatedFiles)
      return filtered
    })
  }, [onChange])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (previewImages.length + acceptedFiles.length > maxFiles) {
      toast({ title: 'Error', description: `Solo puedes subir hasta ${maxFiles} imágenes`, variant: 'destructive' })
      return
    }

    // Validar tamaño y tipo de archivos
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxFileSize) {
        toast({ title: 'Error', description: `${file.name} es demasiado grande. Máximo ${maxFileSize / (1024 * 1024)}MB`, variant: 'destructive' })
        return false
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Error', description: `${file.name} no es una imagen válida`, variant: 'destructive' })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Crear previsualizaciones
    const newPreviews = validFiles.map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file
    }))

    setPreviewImages(prev => {
      const updated = [...prev, ...newPreviews]
      const updatedFiles = updated.map(img => img.file)
      onChange(updatedFiles)
      return updated
    })
  }, [maxFiles, maxFileSize, onChange, previewImages.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: maxFileSize,
    maxFiles,
    disabled
  })

  // Limpiar las URLs al desmontar
  useEffect(() => {
    return () => {
      previewImages.forEach(image => URL.revokeObjectURL(image.url))
    }
  }, [])

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={disabled} />
        <div className="space-y-2">
          {isDragActive ? (
            <p className="text-primary">Suelta las imágenes aquí</p>
          ) : (
            <>
              <p className="text-gray-500">
                Arrastra y suelta imágenes aquí, o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-400">
                Formatos: PNG, JPG, JPEG, GIF, WEBP (máx. {maxFileSize / (1024 * 1024)}MB)
              </p>
              <p className="text-sm text-gray-400">
                Máximo {maxFiles} {maxFiles === 1 ? 'imagen' : 'imágenes'}
              </p>
            </>
          )}
        </div>
      </div>

      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewImages.map((preview) => (
            <div key={preview.id} className="relative aspect-square rounded-lg overflow-hidden group">
              <Image
                src={preview.url}
                alt="Vista previa"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <button
                type="button"
                onClick={(e) => handleRemoveImage(preview.id, e)}
                className="absolute top-2 right-2 p-1 rounded-full bg-white/80 shadow-sm 
                         text-gray-600 hover:text-red-600 transition-all transform
                         opacity-100 md:opacity-0 group-hover:opacity-100 
                         hover:scale-110 active:scale-95
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Eliminar imagen"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 