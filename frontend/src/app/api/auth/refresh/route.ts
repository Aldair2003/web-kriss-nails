import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    console.log('Token en refresh:', token ? 'Existe' : 'No existe');

    if (!token) {
      console.log('No se encontró token en las cookies');
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Intentando refrescar token con el backend...');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      cache: 'no-store'
    });

    console.log('Respuesta del backend:', response.status);
    
    if (!response.ok) {
      console.log('Error al refrescar token:', response.status);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }

    const data = await response.json();
    console.log('Token refrescado exitosamente');

    // Crear la respuesta
    const response_data = {
      user: data.user,
      accessToken: data.accessToken
    };

    // Crear la respuesta con las cookies
    const res = new NextResponse(JSON.stringify(response_data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Actualizar la cookie
    res.cookies.set({
      name: 'token',
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    });

    return res;
  } catch (error) {
    console.error('Error en refresh:', error);
    return NextResponse.json(
      { message: 'Error al refrescar el token' },
      { status: 500 }
    );
  }
} 