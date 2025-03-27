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
    headers,
    credentials: 'include'
  })

  // Verificar si hay un nuevo token
  checkForNewToken(response)

  return response
} 