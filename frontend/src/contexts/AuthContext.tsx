import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { setSession as setAuthSession, clearSession, getSession, setRefreshToken } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001')

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isTransitioning: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  refreshUserSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Función para verificar si el servidor está disponible con manejo de errores mejorado
const checkServerAvailability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.status === 429) {
      console.log('Demasiadas solicitudes al servidor, esperando...')
      return true // Asumimos que el servidor está disponible pero sobrecargado
    }

    const data = await response.json()
    return data.status === 'OK'
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('La solicitud de verificación del servidor excedió el tiempo de espera')
      } else if ((error as any).code === 'ERR_NETWORK') {
        console.log('Error de red al verificar el servidor')
      } else {
        console.error('Error al verificar disponibilidad del servidor:', error)
      }
    }
    return true // En caso de error de CORS o red, asumimos que el servidor está disponible
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const navigationLock = useRef(false)
  const authInitialized = useRef(false)

  const handleNavigation = useCallback(async () => {
    if (loading || isTransitioning || navigationLock.current || !authInitialized.current) return

    const isLoginPage = pathname?.includes('/login')
    const isProtectedRoute = pathname?.startsWith('/rachell-admin') && !isLoginPage
    const isAuthenticated = !!user

    if (isLoginPage && isAuthenticated) {
      navigationLock.current = true
      await router.push('/rachell-admin/dashboard')
      navigationLock.current = false
    } else if (isProtectedRoute && !isAuthenticated) {
      navigationLock.current = true
      await router.push('/rachell-admin/login')
      navigationLock.current = false
    }
  }, [loading, isTransitioning, user, router, pathname])

  const refreshToken = async () => {
    try {
      const currentSession = await getSession()
      if (!currentSession?.accessToken) return false

      // Obtener refresh token del localStorage
      const refreshToken = localStorage.getItem('refreshToken') || currentSession.accessToken;
      console.log('🔍 Refresh token encontrado:', refreshToken ? 'Sí' : 'No');
      console.log('🔍 localStorage refreshToken:', localStorage.getItem('refreshToken'));
      
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
          // Sin Authorization header para evitar confusión
        },
        body: JSON.stringify({ refreshToken })
        // Sin credentials para evitar problemas de cookies
      })

      if (!response.ok) return false

      const data = await response.json()
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      }
      
      setUser(userData)
      setAuthSession({
        accessToken: data.accessToken,
        user: userData
      })
      
      // 🔧 IMPORTANTE: Guardar el nuevo refresh token si está disponible
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken)
        console.log('🔧 Frontend: Nuevo refresh token guardado');
      } else {
        console.log('🔧 Frontend: No se recibió nuevo refresh token');
      }
      
      return true
    } catch (error) {
      console.error('Error en refresh token:', error)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsTransitioning(true)
      navigationLock.current = true
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
        // Sin credentials para evitar problemas de cookies
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de conexión con el servidor' }))
        throw new Error(error.message || 'Credenciales inválidas')
      }

      const data = await response.json()
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      }
      
      // Primero establecemos la sesión y el usuario
      setAuthSession({
        accessToken: data.accessToken,
        user: userData
      })
      
      // Guardar refresh token si está disponible
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken)
      }
      
      setUser(userData)
      
      // Esperamos un momento para asegurar que los estados se han actualizado
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Realizamos la navegación
      await router.push('/rachell-admin/dashboard')
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error al iniciar sesión')
    } finally {
      // Liberamos los bloqueos después de que todo está listo
      navigationLock.current = false
      setIsTransitioning(false)
    }
  }

  const logout = async () => {
    try {
      setIsTransitioning(true)
      const currentSession = await getSession()
      if (currentSession?.accessToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.accessToken}`
          }
          // Sin credentials para evitar problemas de cookies
        })
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setUser(null)
      clearSession()
      navigationLock.current = true
      await router.push('/rachell-admin/login')
      navigationLock.current = false
      setIsTransitioning(false)
    }
  }

  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      if (!mounted) return
      
      try {
        const currentSession = await getSession()
        
        if (currentSession?.user && currentSession.user.role && mounted) {
          setUser({
            id: currentSession.user.id,
            name: currentSession.user.name,
            email: currentSession.user.email,
            role: currentSession.user.role
          })
          
          if (!pathname?.includes('/login')) {
            await refreshToken()
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
          authInitialized.current = true
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
      authInitialized.current = false
    }
  }, [pathname])

  useEffect(() => {
    if (authInitialized.current) {
      handleNavigation()
    }
  }, [pathname, user, handleNavigation])

  const value = {
    user,
    loading,
    isTransitioning,
    login,
    logout,
    isAuthenticated: !!user,
    refreshUserSession: refreshToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
} 