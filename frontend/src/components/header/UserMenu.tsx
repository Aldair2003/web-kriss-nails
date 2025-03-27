import { useRef, useEffect, useState } from 'react'
import { UserCircleIcon, ArrowLeftOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

interface UserMenuProps {
  onLogout: () => void
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        {/* Avatar/Inicial */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center border border-pink-100 group-hover:border-pink-200 transition-colors">
          <span className="text-sm sm:text-base font-medium text-pink-600">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* Nombre y Email - Solo visible en desktop */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user.name}</span>
          <span className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</span>
        </div>
        
        <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {/* Info de usuario - Solo visible en móvil */}
          <div className="sm:hidden px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          {/* Botón de cerrar sesión */}
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:text-pink-600 flex items-center gap-2 hover:bg-pink-50/50 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  )
} 