import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.config.js';

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId: string, refreshToken: string) => {
  try {
    console.log('Almacenando refresh token para usuario:', userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    // Crear nuevo token primero
    const newToken = await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
    console.log('Nuevo token creado con ID:', newToken.id);

    // Eliminar tokens antiguos del usuario después de crear el nuevo
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: { 
        userId,
        id: { not: newToken.id } // No eliminar el token que acabamos de crear
      }
    });
    console.log('Tokens antiguos eliminados:', deletedTokens.count);

    return true;
  } catch (error) {
    console.error('Error al almacenar refresh token:', error);
    return false;
  }
};

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      console.log('=== INICIO LOGIN ===');
      console.log('Headers recibidos:', JSON.stringify(req.headers, null, 2));
      console.log('Cookies recibidas:', JSON.stringify(req.cookies, null, 2));
      console.log('Body recibido:', JSON.stringify(req.body, null, 2));
      
      const { email, password } = req.body;
      console.log('Intento de login para:', email);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.log('Usuario no encontrado:', email);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Contraseña inválida para usuario:', email);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      console.log('Login exitoso para usuario:', user.id);
      const { accessToken, refreshToken } = generateTokens(user.id, user.role);
      
      console.log('Almacenando refresh token...');
      const tokenStored = await storeRefreshToken(user.id, refreshToken);
      if (!tokenStored) {
        console.error('Error al almacenar el token');
        return res.status(500).json({ message: 'Error al iniciar sesión' });
      }

      console.log('Configurando cookie de token...');
      res.cookie('token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

      console.log('Enviando respuesta...');
      console.log('=== FIN LOGIN ===');
      
      res.json({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error completo en login:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const { accessToken, refreshToken } = generateTokens(user.id, user.role);
      await storeRefreshToken(user.id, refreshToken);

      res.cookie('token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

      res.status(201).json({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error en register:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  refresh: async (req: Request, res: Response) => {
    try {
      console.log('=== INICIO REFRESH TOKEN ===');
      console.log('Headers recibidos:', JSON.stringify(req.headers, null, 2));
      console.log('Cookies recibidas:', JSON.stringify(req.cookies, null, 2));
      console.log('Body recibido:', JSON.stringify(req.body, null, 2));
      
      const token = req.cookies.token;
      
      if (!token) {
        console.log('No se encontró token en las cookies');
        return res.status(401).json({ message: 'No se proporcionó token' });
      }

      console.log('Token encontrado en cookies:', token);
      console.log('Buscando token en la base de datos...');
      
      const storedToken = await prisma.refreshToken.findFirst({
        where: { 
          token,
          expiresAt: {
            gt: new Date()
          }
        },
        include: { user: true },
      });

      if (!storedToken) {
        console.log('Token no encontrado en la base de datos o expirado');
        return res.status(401).json({ message: 'Token inválido o expirado' });
      }

      console.log('Token válido encontrado para usuario:', storedToken.userId);
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(storedToken.userId, storedToken.user.role);

      console.log('Almacenando nuevo token...');
      const tokenStored = await storeRefreshToken(storedToken.userId, newRefreshToken);
      
      if (!tokenStored) {
        console.error('Error al almacenar el nuevo token');
        return res.status(500).json({ message: 'Error al refrescar la sesión' });
      }

      console.log('Configurando cookie de token...');
      res.cookie('token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

      console.log('Enviando respuesta...');
      console.log('=== FIN REFRESH TOKEN ===');
      
      res.json({
        accessToken,
        user: {
          id: storedToken.user.id,
          name: storedToken.user.name,
          email: storedToken.user.email,
          role: storedToken.user.role,
        },
      });
    } catch (error) {
      console.error('Error completo en refresh:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      console.log('=== INICIO LOGOUT ===');
      console.log('Headers recibidos:', JSON.stringify(req.headers, null, 2));
      console.log('Cookies recibidas:', JSON.stringify(req.cookies, null, 2));
      
      const token = req.cookies.token;
      if (token) {
        console.log('Eliminando token de la base de datos...');
        await prisma.refreshToken.deleteMany({
          where: { token }
        });
      }

      console.log('Limpiando cookie...');
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      console.log('Enviando respuesta...');
      console.log('=== FIN LOGOUT ===');
      
      res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      console.error('Error completo en logout:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
}; 