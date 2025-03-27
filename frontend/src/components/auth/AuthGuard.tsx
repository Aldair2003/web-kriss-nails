'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { memo } from 'react'

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, isTransitioning, user } = useAuth()
  const pathname = usePathname()
  const isLoginPage = pathname === '/rachell-admin/login'
  const isProtectedRoute = pathname?.startsWith('/rachell-admin') && !isLoginPage

  // Durante cualquier transición, mantenemos la pantalla actual
  if (isTransitioning) {
    return <LoadingSpinner message="Iniciando sesión..." />
  }

  // Mostrar spinner durante la carga inicial
  if (loading) {
    return <LoadingSpinner message="Cargando..." />
  }

  // Para rutas protegidas, aseguramos que tenemos los datos necesarios
  if (isProtectedRoute && (!isAuthenticated || !user)) {
    return <LoadingSpinner message="Verificando acceso..." />
  }

  // Para la página de login, si ya está autenticado, mostramos loading
  if (isLoginPage && isAuthenticated) {
    return <LoadingSpinner message="Redirigiendo..." />
  }

  return <>{children}</>
}

export default memo(AuthGuard) 