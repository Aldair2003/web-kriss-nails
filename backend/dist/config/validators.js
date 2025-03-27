import { z } from 'zod';
// Validadores de autenticación
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
// Validadores de servicios
export const serviceSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    price: z.number().positive('El precio debe ser positivo'),
    duration: z.number().positive('La duración debe ser positiva'),
    category: z.string(),
});
// Validadores de citas
export const appointmentSchema = z.object({
    clientName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    clientPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
    clientEmail: z.string().email('Email inválido').optional(),
    serviceId: z.string().uuid('ID de servicio inválido'),
    date: z.string().datetime('Fecha inválida'),
    notes: z.string().optional(),
});
// Validadores de reseñas
export const reviewSchema = z.object({
    clientName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    rating: z.number().min(1).max(5, 'La calificación debe estar entre 1 y 5'),
    comment: z.string().min(10, 'El comentario debe tener al menos 10 caracteres'),
});
// Validadores de imágenes
export const imageSchema = z.object({
    url: z.string().url('URL inválida'),
    type: z.enum(['GALLERY', 'BEFORE_AFTER', 'SERVICE']),
    category: z.string().optional(),
    serviceId: z.string().uuid('ID de servicio inválido').optional(),
});
