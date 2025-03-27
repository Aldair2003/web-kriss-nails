import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No autorizado - Token no proporcionado' });
        }
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'No autorizado - Token inválido' });
    }
};
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado - Se requiere rol de administrador' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al verificar rol de administrador' });
    }
};
