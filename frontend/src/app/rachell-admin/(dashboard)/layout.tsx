'use client'

import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useState, useEffect, memo, useMemo } from 'react'
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
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

// Interfaces para los tipos de iconos
interface IconProps {
  className?: string
  isActive?: boolean
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
  { name: 'Galería', href: '/rachell-admin/galeria', icon: PhotoIcon },
  { name: 'Reseñas', href: '/rachell-admin/resenas', icon: StarIcon },
]

function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Restaurar el estado del sidebar desde localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState))
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
                      src="/images/logokris.jpg"
                      alt="Logo"
                      fill
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
            <UserMenu onLogout={handleLogout} />
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default memo(DashboardLayout) 