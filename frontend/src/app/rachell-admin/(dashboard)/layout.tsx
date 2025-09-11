'use client'

import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useState, useEffect, memo, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { 
  HomeIcon, 
  CalendarIcon, 
  PhotoIcon, 
  StarIcon, 
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { getUnreadReviewsCount } from '@/services/review-service'
import { getAppointments } from '@/services/appointment-service'
import { getAvailabilities } from '@/services/availability-service'
import { getPublicHoursByDateRange } from '@/services/public-hours-service'
import { format } from 'date-fns'
import React from 'react'
import { cn } from '@/lib/utils'
import { ToastProvider } from '@/components/ui/toast'

// Interfaces para los tipos de iconos
interface IconProps {
  className?: string
  isActive?: boolean
}

// Interfaz para las notificaciones
interface NotificationData {
  unreadCount: number
  pendingAppointments: number
  upcomingAppointments: number
  todayAppointments?: number
  tomorrowAppointments?: number
  daysWithoutHours?: number
  upcomingDaysWithoutHours?: number
  hoursConfiguredToday?: number
  nextDaysWithHours?: number
}

// Tipo para iconos de Heroicons
type HeroIconType = React.ComponentType<React.ComponentProps<'svg'>>

// Tipo unión para manejar tanto iconos personalizados como Heroicons
type IconType = HeroIconType | React.ComponentType<IconProps>

interface NavigationItem {
  name: string
  href: string
  icon: IconType
  isCustomIcon?: boolean
  badge?: string
}

const UserMenu = dynamic(() => import('@/components/header/UserMenu'), {
  ssr: false,
})

// Componente de navegación memoizado
const NavigationItem = memo(({ item, pathname, isCollapsed }: { 
  item: NavigationItem
  pathname: string
  isCollapsed: boolean 
}) => {
  const isActive = pathname === item.href
  const Icon = item.icon
  const badgeCount = useBadgeCount(item.badge)

  const iconClassName = `flex-shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${
    isActive ? 'text-pink-600' : 'text-gray-400'
  }`

  return (
    <Link
      href={item.href}
      className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
        isActive 
          ? 'bg-pink-50 text-pink-600' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {isActive && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-0 top-[1px] bottom-[1px] w-0.5 bg-pink-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}
      {item.isCustomIcon ? (
        <Icon className={iconClassName} isActive={isActive} />
      ) : (
        <Icon className={iconClassName} aria-hidden="true" />
      )}
      {!isCollapsed && (
        <span className={`font-medium whitespace-nowrap ${
          isActive ? 'text-pink-600' : 'text-gray-600'
        }`}>
          {item.name}
        </span>
      )}
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-medium text-white">
          {badgeCount}
        </span>
      )}
    </Link>
  )
})

NavigationItem.displayName = 'NavigationItem'

// Componente personalizado para el icono de servicios
const ServiceIcon: React.ComponentType<IconProps> = ({ className, isActive }) => (
  <div className={`relative w-5 h-5 ${className} transition-colors`}>
    <Image
      src="/icon/manicureicon1.png"
      alt="Servicios"
      fill
      sizes="20px"
      className="object-contain"
      style={{
        filter: isActive 
          ? 'brightness(0) saturate(100%) invert(36%) sepia(66%) saturate(2849%) hue-rotate(316deg) brightness(100%) contrast(97%)'
          : 'brightness(0) opacity(0.4)',
      }}
    />
  </div>
)

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/rachell-admin/dashboard', icon: HomeIcon },
  { name: 'Servicios', href: '/rachell-admin/servicios', icon: ServiceIcon, isCustomIcon: true },
  { name: 'Citas', href: '/rachell-admin/citas', icon: CalendarIcon },
  { name: 'Horarios', href: '/rachell-admin/horarios', icon: ClockIcon },
  { name: 'Galería', href: '/rachell-admin/galeria', icon: PhotoIcon },
  { name: 'Reseñas', href: '/rachell-admin/resenas', icon: StarIcon, badge: 'unreadReviews' },
]

function DashboardLayout({ 
  children, 
  notifications 
}: { 
  children: ReactNode
  notifications: NotificationData
}) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [unreadReviews, setUnreadReviews] = useState<number>(0)
  const [needsDriveAuth, setNeedsDriveAuth] = useState<boolean>(false)
  const [driveBannerDismissed, setDriveBannerDismissed] = useState<boolean>(false)

  // Restaurar el estado del sidebar desde localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Cargar conteo de reseñas no leídas
  useEffect(() => {
    const fetchUnreadReviews = async () => {
      try {
        const count = await getUnreadReviewsCount()
        setUnreadReviews(count)
      } catch (error) {
        console.error('Error al obtener reseñas no leídas:', error)
      }
    }

    if (user) {
      fetchUnreadReviews()
      
      // Configurar un intervalo para actualizar cada 5 minutos
      const interval = setInterval(fetchUnreadReviews, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Revisar si Google Drive requiere reconexión (banner suavemente visible)
  useEffect(() => {
    const dismissed = localStorage.getItem('driveBannerDismissed') === 'true'
    setDriveBannerDismissed(dismissed)

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/oauth/status', { credentials: 'include' })
        const data = await res.json()
        const needs = Array.isArray(data?.tokensNeedingAuth) && data.tokensNeedingAuth.includes('google_drive')
        setNeedsDriveAuth(!!needs)
      } catch (error) {
        // Silencioso: no bloquear la UI por esto
      }
    }

    fetchStatus()
  }, [])

  // Si vuelve de OAuth con ?token_renewed=google_drive, limpiar banner
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const renewed = params.get('token_renewed')
    if (renewed === 'google_drive') {
      setNeedsDriveAuth(false)
      localStorage.removeItem('driveBannerDismissed')
      // Limpiar query sin recargar duro
      const url = new URL(window.location.href)
      url.searchParams.delete('token_renewed')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const dismissDriveBanner = useCallback(() => {
    setDriveBannerDismissed(true)
    localStorage.setItem('driveBannerDismissed', 'true')
  }, [])

  const handleReconnectDrive = useCallback(async () => {
    try {
      const res = await fetch('/api/oauth/google-drive/start')
      const data = await res.json()
      if (data?.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('No se pudo iniciar la reconexión de Google Drive')
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  const handleLogout = () => {
    logout()
    router.push('/rachell-admin/login')
  }

  const currentPageName = useMemo(() => {
    // Manejar rutas específicas de servicios
    if (pathname?.includes('/servicios/nuevo')) {
      return 'Nuevo servicio'
    }
    if (pathname?.includes('/servicios/') && pathname?.includes('/edit')) {
      return 'Editar servicio'
    }
    // Buscar en la navegación principal
    return navigation.find(item => item.href === pathname)?.name || 'Dashboard'
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sidebar para desktop */}
      <motion.nav 
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 288,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col border-r border-gray-200 bg-white"
      >
        {/* Header del Sidebar */}
        <div className="flex-shrink-0 h-[3.975rem] border-b border-gray-200 relative overflow-hidden">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.div 
                  key="expanded"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 flex flex-col relative"
                >
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="text-lg font-semibold text-gray-900 leading-none"
                  >
                    Kris Beauty Nails
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: 0.05 }}
                    className="text-xs text-gray-500 mt-1"
                  >
                    Panel Administrativo
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div 
                  key="collapsed"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center h-full relative"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden relative">
                    <Image
                      src="/images/logooriginal.webp"
                      alt="Logo"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Línea indicadora que persiste en ambos estados */}
            <motion.div 
              layoutId="sidebarHeaderIndicator"
              className="absolute bottom-[-0.5px] left-0 right-0 h-0.5 bg-pink-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Navegación Principal */}
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {navigation.map((item) => (
              <NavigationItem 
                key={item.href} 
                item={item} 
                pathname={pathname || ''} 
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>

        {/* Botón de colapsar en la parte inferior */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="font-medium">Colapsar menú</span>
              </>
            )}
          </button>
        </div>
      </motion.nav>

      {/* Sidebar para móvil con animaciones */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 lg:hidden"
            >
              {/* Header del Sidebar Móvil */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="h-[3.975rem] border-b border-gray-200 flex items-center justify-between px-4 relative"
              >
                <div className="flex flex-col">
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-semibold text-gray-900 leading-none"
                  >
                    Kris Beauty Nails
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-gray-500 mt-1"
                  >
                    Panel Administrativo
                  </motion.p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/50"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <motion.div 
                  layoutId="sidebarMobileHeaderIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              {/* Navegación Móvil */}
              <div className="flex-1 py-4 overflow-y-auto">
                <div className="space-y-1 px-3">
                  {navigation.map((item) => (
                    <NavigationItem 
                      key={item.href} 
                      item={item} 
                      pathname={pathname || ''} 
                      isCollapsed={false}
                    />
                  ))}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <main className={`min-h-screen transition-all ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="h-[3.974rem] px-3 sm:px-4 lg:px-6 flex items-center justify-between relative">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-1.5 -ml-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/50"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {currentPageName}
              </h1>
            </div>
            
            {/* Línea indicadora en el header */}
            <motion.div 
              layoutId="headerIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* UserMenu en el header */}
            <UserMenu onLogout={handleLogout} notifications={notifications} />
          </div>
        </header>
        {/* Banner sutil para reconectar Google Drive */}
        {needsDriveAuth && !driveBannerDismissed && (
          <div className="px-3 sm:px-4 lg:px-6 mt-3">
            <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50/70 text-gray-800 px-3 py-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-pink-500"></span>
              <p className="text-sm flex-1">
                Google Drive necesita reconexión para continuar subiendo imágenes.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReconnectDrive}
                  className="inline-flex items-center rounded-md bg-pink-500 hover:bg-pink-600 text-white text-sm px-3 py-1.5 transition-colors"
                >
                  Reconectar Google Drive
                </button>
                <button
                  onClick={dismissDriveBanner}
                  className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
                >
                  Más tarde
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

// Hook para obtener el conteo de badges
function useBadgeCount(badgeType?: string): number {
  const { unreadReviews = 0 } = useDashboardContext()
  
  if (!badgeType) return 0
  
  switch (badgeType) {
    case 'unreadReviews':
      return unreadReviews
    default:
      return 0
  }
}

// Contexto para compartir datos en el dashboard
const DashboardContext = React.createContext<{
  unreadReviews: number
}>({
  unreadReviews: 0,
})

// Provider para el contexto del dashboard
function DashboardProvider({ 
  children, 
  unreadReviews 
}: { 
  children: ReactNode
  unreadReviews: number
}) {
  return (
    <ToastProvider>
      <DashboardContext.Provider value={{ unreadReviews }}>
        {children}
      </DashboardContext.Provider>
    </ToastProvider>
  )
}

// Hook para usar el contexto
function useDashboardContext() {
  return React.useContext(DashboardContext)
}

// Wrapper para el layout con el provider
function WrappedDashboardLayout({ children }: { children: ReactNode }) {
  const { 
    unreadReviews, 
    pendingAppointments, 
    upcomingAppointments, 
    todayAppointments, 
    tomorrowAppointments,
    daysWithoutHours,
    upcomingDaysWithoutHours,
    hoursConfiguredToday,
    nextDaysWithHours
  } = useUnreadCounts()
  
  return (
    <DashboardProvider unreadReviews={unreadReviews}>
      <DashboardLayoutInner 
        notifications={{
          unreadCount: unreadReviews + pendingAppointments + (todayAppointments || 0) + (tomorrowAppointments || 0) + (daysWithoutHours || 0) + (upcomingDaysWithoutHours || 0),
          pendingAppointments,
          upcomingAppointments,
          todayAppointments,
          tomorrowAppointments,
          daysWithoutHours,
          upcomingDaysWithoutHours,
          hoursConfiguredToday,
          nextDaysWithHours
        }}
      >
        {children}
      </DashboardLayoutInner>
    </DashboardProvider>
  )
}

// Hook para obtener conteos
function useUnreadCounts() {
  const [unreadReviews, setUnreadReviews] = useState(0)
  const [pendingAppointments, setPendingAppointments] = useState(0)
  const [upcomingAppointments, setUpcomingAppointments] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [tomorrowAppointments, setTomorrowAppointments] = useState(0)
  // Estados para notificaciones de horarios
  const [daysWithoutHours, setDaysWithoutHours] = useState(0)
  const [upcomingDaysWithoutHours, setUpcomingDaysWithoutHours] = useState(0)
  const [hoursConfiguredToday, setHoursConfiguredToday] = useState(0)
  const [nextDaysWithHours, setNextDaysWithHours] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return
      
      try {
        const [reviewCount, appointmentsData, availabilitiesData, publicHoursData] = await Promise.all([
          getUnreadReviewsCount(),
          getAppointments({ limit: 100 }),
          getAvailabilities(new Date().getMonth() + 1, new Date().getFullYear()),
          getPublicHoursByDateRange(
            format(new Date(), 'yyyy-MM-dd'), // Hoy
            format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') // Próximos 7 días
          )
        ])
        
        setUnreadReviews(reviewCount)
        
        // Calcular citas pendientes y próximas
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const pending = appointmentsData.appointments.filter(apt => apt.status === 'PENDING').length
        
        // Citas de hoy
        const todayCitas = appointmentsData.appointments.filter(apt => {
          const aptDate = new Date(apt.date)
          return aptDate.toDateString() === today.toDateString()
        }).length
        
        // Citas de mañana
        const tomorrowCitas = appointmentsData.appointments.filter(apt => {
          const aptDate = new Date(apt.date)
          return aptDate.toDateString() === tomorrow.toDateString()
        }).length
        
        // Total de citas próximas (hoy + mañana)
        const upcoming = todayCitas + tomorrowCitas
        
        setPendingAppointments(pending)
        setUpcomingAppointments(upcoming)
        setTodayAppointments(todayCitas)
        setTomorrowAppointments(tomorrowCitas)
        
        // Calcular notificaciones de horarios
        const todayForHours = new Date()
        const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        
        // Días habilitados pero sin horarios configurados
        const enabledDates = availabilitiesData.map(av => av.date)
        const daysWithHours = Object.keys(publicHoursData).length
        const daysWithoutHoursCount = enabledDates.length - daysWithHours
        
        // Horas configuradas hoy
        const todayStr = format(todayForHours, 'yyyy-MM-dd')
        const hoursToday = (publicHoursData as any)[todayStr]?.length || 0
        
        // Próximos días sin horarios (en los próximos 7 días)
        let upcomingDaysWithoutHoursCount = 0
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date(todayForHours)
          futureDate.setDate(todayForHours.getDate() + i)
          const futureDateStr = format(futureDate, 'yyyy-MM-dd')
          
          if (enabledDates.includes(futureDateStr) && !(publicHoursData as any)[futureDateStr]) {
            upcomingDaysWithoutHoursCount++
          }
        }
        
        setDaysWithoutHours(Math.max(0, daysWithoutHoursCount))
        setUpcomingDaysWithoutHours(upcomingDaysWithoutHoursCount)
        setHoursConfiguredToday(hoursToday)
        setNextDaysWithHours(Object.keys(publicHoursData).length)
      } catch (error) {
        console.error('Error al obtener conteos:', error)
      }
    }

    fetchCounts()
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchCounts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  return { 
    unreadReviews, 
    pendingAppointments, 
    upcomingAppointments, 
    todayAppointments, 
    tomorrowAppointments,
    daysWithoutHours,
    upcomingDaysWithoutHours,
    hoursConfiguredToday,
    nextDaysWithHours
  }
}

// Componente interno para el layout
const DashboardLayoutInner = memo(DashboardLayout)

export default memo(WrappedDashboardLayout) 