import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Intentando login con:', body.email);

    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();
    console.log('Respuesta del backend:', response.status);

    if (!response.ok) {
      console.log('Error en login:', data.message);
      return NextResponse.json(
        { message: data.message || 'Credenciales inválidas' },
        { status: response.status }
      );
    }

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

    // Guardar el token en una cookie
    console.log('Guardando token en cookie...');
    res.cookies.set({
      name: 'token',
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    });

    console.log('Token guardado en cookie');
    return res;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { message: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
} 