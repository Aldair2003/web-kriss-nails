interface Session {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

let currentSession: Session | null = null

export const setSession = (session: Session) => {
  currentSession = session
  localStorage.setItem('session', JSON.stringify(session))
}

export const setRefreshToken = (refreshToken: string) => {
  localStorage.setItem('refreshToken', refreshToken)
}

export const getSession = async (): Promise<Session | null> => {
  // Si ya tenemos una sesión en memoria, la devolvemos
  if (currentSession) {
    return currentSession
  }

  // Intentar obtener la sesión del localStorage
  const storedSession = localStorage.getItem('session')
  if (storedSession) {
    try {
      currentSession = JSON.parse(storedSession)
      return currentSession
    } catch {
      clearSession()
    }
  }

  return null
}

export const clearSession = () => {
  currentSession = null
  localStorage.removeItem('session')
}

export const updateAccessToken = (newAccessToken: string) => {
  if (currentSession) {
    currentSession.accessToken = newAccessToken
    localStorage.setItem('session', JSON.stringify(currentSession))
  }
}

// Función para verificar si hay un nuevo token en las cabeceras de respuesta
export const checkForNewToken = (response: Response) => {
  const newToken = response.headers.get('X-New-Access-Token')
  if (newToken) {
    updateAccessToken(newToken)
  }
}

// Función para hacer peticiones autenticadas
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const session = await getSession()
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${session.accessToken}`)

  const response = await fetch(url, {
    ...options,
    headers
    // Sin credentials para evitar problemas de cookies
  })

  // Verificar si hay un nuevo token
  checkForNewToken(response)

  return response
}

// Función específica para refresh token
export const refreshToken = async () => {
  const session = await getSession()
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  // Intentar obtener refresh token del localStorage o usar el access token como fallback
  const refreshToken = localStorage.getItem('refreshToken') || session.accessToken

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // Sin Authorization header para evitar confusión
    },
    body: JSON.stringify({ refreshToken })
    // Sin credentials para evitar problemas de cookies
  })

  if (response.ok) {
    const data = await response.json()
    updateAccessToken(data.accessToken)
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }
    return data
  } else {
    throw new Error('Error al refrescar el token')
  }
} 