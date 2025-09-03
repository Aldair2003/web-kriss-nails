import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.config.js';
const generateTokens = (userId, role) => {
    const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
const storeRefreshToken = async (userId, refreshToken) => {
    try {
        console.log('🔧 DEBUG STORE - Almacenando refresh token para usuario:', userId);
        console.log('🔧 DEBUG STORE - Token a guardar:', refreshToken.substring(0, 20) + '...');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
        // Primero eliminar todos los tokens antiguos del usuario
        console.log('🔧 DEBUG STORE - Eliminando tokens antiguos...');
        const deletedTokens = await prisma.refreshToken.deleteMany({
            where: { userId }
        });
        console.log('🔧 DEBUG STORE - Tokens eliminados:', deletedTokens.count);
        // Luego crear el nuevo token
        console.log('🔧 DEBUG STORE - Creando nuevo token...');
        const newToken = await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });
        console.log('🔧 DEBUG STORE - Nuevo token creado con ID:', newToken.id);
        // Verificar que se guardó correctamente
        const verification = await prisma.refreshToken.findFirst({
            where: { token: refreshToken }
        });
        console.log('🔧 DEBUG STORE - Verificación de guardado:', verification ? 'EXITOSO' : 'FALLIDO');
        return true;
    }
    catch (error) {
        console.error('❌ Error al almacenar refresh token:', error);
        return false;
    }
};
export const authController = {
    login: async (req, res) => {
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
            console.log('🔧 DEBUG LOGIN - Refresh token generado:', refreshToken.substring(0, 20) + '...');
            console.log('Almacenando refresh token...');
            const tokenStored = await storeRefreshToken(user.id, refreshToken);
            if (!tokenStored) {
                console.error('Error al almacenar el token');
                return res.status(500).json({ message: 'Error al iniciar sesión' });
            }
            // Verificar que el token se guardó correctamente
            const savedToken = await prisma.refreshToken.findFirst({
                where: { token: refreshToken }
            });
            console.log('🔧 DEBUG LOGIN - Token guardado en BD:', savedToken ? 'SÍ' : 'NO');
            console.log('Token generado sin cookies (solo localStorage)');
            console.log('Enviando respuesta...');
            console.log('=== FIN LOGIN ===');
            res.json({
                accessToken,
                refreshToken, // Enviar refresh token al frontend
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (error) {
            console.error('Error completo en login:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },
    register: async (req, res) => {
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
            console.log('Token generado sin cookies (solo localStorage)');
            res.status(201).json({
                accessToken,
                refreshToken, // Enviar refresh token al frontend
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (error) {
            console.error('Error en register:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },
    refresh: async (req, res) => {
        try {
            console.log('=== INICIO REFRESH TOKEN ===');
            console.log('Body recibido:', JSON.stringify(req.body, null, 2));
            // Buscar refresh token SOLO en body o headers específicos (sin cookies)
            let token = req.body.refreshToken || req.headers['x-refresh-token'];
            if (!token) {
                console.log('❌ No se encontró refreshToken en body ni en x-refresh-token header');
                console.log('📋 Body recibido:', req.body);
                console.log('📋 Headers recibidos:', req.headers);
                return res.status(401).json({ message: 'No se proporcionó refresh token' });
            }
            console.log('🔧 Token recibido del frontend:', token.substring(0, 20) + '...');
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
                console.log('Fecha actual:', new Date());
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
            console.log('Enviando respuesta...');
            console.log('=== FIN REFRESH TOKEN ===');
            res.json({
                accessToken,
                refreshToken: newRefreshToken, // 🔧 IMPORTANTE: Enviar el nuevo refresh token
                user: {
                    id: storedToken.user.id,
                    name: storedToken.user.name,
                    email: storedToken.user.email,
                    role: storedToken.user.role,
                },
            });
        }
        catch (error) {
            console.error('Error completo en refresh:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },
    logout: async (req, res) => {
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
            console.log('Logout sin cookies (solo localStorage)');
            console.log('Enviando respuesta...');
            console.log('=== FIN LOGOUT ===');
            res.json({ message: 'Sesión cerrada exitosamente' });
        }
        catch (error) {
            console.error('Error completo en logout:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },
};
