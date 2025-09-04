import { useRef, useEffect, useState } from 'react'
import { UserCircleIcon, ArrowLeftOnRectangleIcon, ChevronDownIcon, BellIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface UserMenuProps {
  onLogout: () => void
  notifications?: {
    unreadCount: number
    pendingAppointments: number
    upcomingAppointments: number
    todayAppointments?: number
    tomorrowAppointments?: number
  }
}

export default function UserMenu({ onLogout, notifications }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      {/* Notificaciones */}
      <div className="relative" ref={notificationsRef}>
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2.5 rounded-lg hover:bg-pink-50 transition-all duration-200 group"
        >
                     {notifications && notifications.unreadCount > 0 && !notificationsOpen ? (
             <motion.div
               animate={{
                 rotate: [0, 8, -8, 6, -4, 2, -1, 0],
                 color: ["#6B7280", "#EC4899", "#EC4899", "#EC4899", "#6B7280", "#EC4899", "#6B7280", "#6B7280"],
                 scale: [1, 1.02, 1, 1.01, 1, 1.005, 1, 1]
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut",
                 repeatDelay: 5
               }}
               className="group-hover:text-pink-600 transition-colors"
               style={{ transformOrigin: "top center" }}
             >
               <BellIcon className="w-6 h-6" />
             </motion.div>
           ) : (
             <BellIcon className={`w-6 h-6 ${notifications && notifications.unreadCount > 0 ? 'text-pink-600' : 'text-gray-500'} group-hover:text-pink-600 transition-colors`} />
           )}
          {notifications && notifications.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[11px] font-semibold text-white shadow-sm">
              {notifications.unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown de Notificaciones */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
            >
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BellIcon className="w-4 h-4 text-pink-500" />
                Notificaciones
              </h3>
            </div>
            
            <div className="space-y-1">
              {notifications && notifications.pendingAppointments > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="px-4 py-2 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        {notifications.pendingAppointments} citas sin confirmar
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Requiere atención</span>
                  </div>
                </motion.div>
              )}
              
              {notifications && notifications.upcomingAppointments > 0 && (
                <>
                  {notifications.todayAppointments && notifications.todayAppointments > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="px-4 py-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">
                            {notifications.todayAppointments} cita{notifications.todayAppointments !== 1 ? 's' : ''} hoy
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Hoy</span>
                      </div>
                    </motion.div>
                  )}
                  
                  {notifications.tomorrowAppointments && notifications.tomorrowAppointments > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="px-4 py-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">
                            {notifications.tomorrowAppointments} cita{notifications.tomorrowAppointments !== 1 ? 's' : ''} mañana
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Mañana</span>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              
              {(!notifications || (notifications.pendingAppointments === 0 && notifications.upcomingAppointments === 0)) && (
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-gray-500">No hay notificaciones nuevas</p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-gray-100">
              <button className="w-full text-xs text-pink-600 hover:text-pink-700 font-medium">
                Ver todas las notificaciones
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Usuario */}
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
  </div>
  )
} 