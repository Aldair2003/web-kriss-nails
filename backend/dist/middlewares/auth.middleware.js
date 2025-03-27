import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import { prisma } from '../config/prisma.js';
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const refreshToken = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: 'No autorizado - Token no proporcionado',
                code: 'TOKEN_MISSING'
            });
        }
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            req.user = decoded;
            return next();
        }
        catch (error) {
            // Si el token de acceso no es válido, intentar refrescar
            if (!refreshToken) {
                return res.status(401).json({
                    message: 'No autorizado - Token expirado y no hay refresh token',
                    code: 'REFRESH_TOKEN_MISSING'
                });
            }
            // Verificar el refresh token en la base de datos
            const storedToken = await prisma.refreshToken.findFirst({
                where: {
                    token: refreshToken,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                include: { user: true }
            });
            if (!storedToken) {
                return res.status(401).json({
                    message: 'No autorizado - Refresh token inválido o expirado',
                    code: 'REFRESH_TOKEN_INVALID'
                });
            }
            // Generar nuevo token de acceso
            const newAccessToken = jwt.sign({ userId: storedToken.userId, role: storedToken.user.role }, env.JWT_SECRET, { expiresIn: '1h' });
            // Enviar el nuevo token en la respuesta
            res.setHeader('X-New-Access-Token', newAccessToken);
            // Establecer el usuario en la request
            req.user = {
                userId: storedToken.userId,
                role: storedToken.user.role
            };
            return next();
        }
    }
    catch (error) {
        console.error('Error en authMiddleware:', error);
        return res.status(500).json({
            message: 'Error al verificar autenticación',
            code: 'AUTH_ERROR'
        });
    }
};
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'No autorizado',
                code: 'USER_NOT_SET'
            });
        }
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Acceso denegado - Se requiere rol de administrador',
                code: 'ADMIN_REQUIRED'
            });
        }
        next();
    }
    catch (error) {
        console.error('Error en isAdmin:', error);
        return res.status(500).json({
            message: 'Error al verificar rol de administrador',
            code: 'ADMIN_CHECK_ERROR'
        });
    }
};
