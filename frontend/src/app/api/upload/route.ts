import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Obtener token de la cookie
    const tokenCookie = request.cookies.get('token')?.value
    
    if (!tokenCookie) {
      console.error('No se encontró token de autenticación en las cookies')
      return NextResponse.json(
        { error: 'No autorizado. Inicie sesión nuevamente.' },
        { status: 401 }
      )
    }
    
    console.log('Token encontrado, intentando refresh')
    
    // Obtener el token de acceso a través de refresh
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${tokenCookie}`
      },
      credentials: 'include',
      body: JSON.stringify({}),
      cache: 'no-store'
    })
    
    if (!refreshResponse.ok) {
      console.error('Error en refresh token:', refreshResponse.status)
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 401 }
      )
    }
    
    const authData = await refreshResponse.json()
    console.log('Datos de usuario recibidos:', JSON.stringify(authData))
    const accessToken = authData.accessToken
    
    // Verificar si el usuario tiene rol de administrador
    if (!authData.user || authData.user.role !== 'ADMIN') {
      console.error('Usuario no tiene rol de administrador:', JSON.stringify(authData.user))
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 }
      )
    }
    
    console.log('Token actualizado correctamente, usuario con rol ADMIN confirmado')
    
    // Reenviar la solicitud al backend con el token de acceso
    const response = await fetch(`${API_URL}/api/drive/upload/temp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData,
    })
    
    console.log('Respuesta del backend:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Error al subir las imágenes: ${response.status}`
      
      try {
        // Intentar parsear la respuesta como JSON
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          errorMessage = errorData.error
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        }
      } catch (e) {
        // Si no es JSON, usar el texto de error como está
        if (errorText) {
          errorMessage += ` - ${errorText}`
        }
      }
      
      console.error('Error del backend:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (_e) {
    console.error('Error en la carga de imágenes:', _e)
    return NextResponse.json(
      { error: _e instanceof Error ? _e.message : 'Error al procesar la carga de imágenes' },
      { status: 500 }
    )
  }
} 