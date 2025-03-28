import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      // Llamar al backend para invalidar el token
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
    }

    const res = NextResponse.json({ message: 'Sesión cerrada exitosamente' });

    // Eliminar la cookie del token
    res.cookies.delete('token');

    return res;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { message: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
} 