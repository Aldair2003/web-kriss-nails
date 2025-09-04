import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmationModalProps) => {
  // Estado local para mantener el contenido durante la transición
  const [localTitle, setLocalTitle] = useState(title)
  const [localMessage, setLocalMessage] = useState(message)

  // Actualizar el contenido local solo cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setLocalTitle(title)
      setLocalMessage(message)
    }
  }, [isOpen, title, message])

  const getColorsByType = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-pink-600',
          button: 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500',
          iconBg: 'bg-pink-50',
          ring: 'ring-pink-600/20'
        }
      case 'warning':
        return {
          icon: 'text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          iconBg: 'bg-amber-50',
          ring: 'ring-amber-600/20'
        }
      case 'info':
        return {
          icon: 'text-violet-600',
          button: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500',
          iconBg: 'bg-violet-50',
          ring: 'ring-violet-600/20'
        }
      default:
        return {
          icon: 'text-pink-600',
          button: 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500',
          iconBg: 'bg-pink-50',
          ring: 'ring-pink-600/20'
        }
    }
  }

  const colors = getColorsByType()

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-[95vw] sm:max-w-md md:max-w-lg transform overflow-hidden rounded-2xl bg-white px-4 py-5 text-left shadow-xl transition-all mx-auto">
                <div className="w-full">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${colors.iconBg} ${colors.ring}`}>
                    <ExclamationTriangleIcon className={`h-7 w-7 ${colors.icon}`} aria-hidden="true" />
                  </div>
                  <div className="mt-4 text-center">
                    <Dialog.Title as="h3" className="text-base sm:text-lg font-semibold leading-6 text-gray-900">
                      {localTitle}
                    </Dialog.Title>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 px-2">
                        {localMessage}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    className="w-full sm:w-32 inline-flex justify-center rounded-xl bg-white px-4 py-3 sm:px-3 sm:py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all touch-feedback"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`w-full sm:w-32 inline-flex justify-center rounded-xl px-4 py-3 sm:px-3 sm:py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 touch-feedback`}
                    onClick={() => {
                      onConfirm()
                      onClose()
                    }}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 