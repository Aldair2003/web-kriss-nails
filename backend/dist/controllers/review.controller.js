import { PrismaClient } from '@prisma/client';
import { emailService } from '../services/email.service.js';
import { env } from '../config/env.config.js';
const prisma = new PrismaClient();
export const getReviews = async (_req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            where: {
                isApproved: true
            },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return res.json(reviews);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const getAllReviews = async (_req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return res.json(reviews);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const createReview = async (req, res) => {
    try {
        const { clientName, rating, comment, clientEmail, serviceId } = req.body;
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
        }
        // Verificar que el servicio existe si se proporciona
        if (serviceId) {
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            });
            if (!service) {
                return res.status(400).json({ message: 'El servicio especificado no existe' });
            }
        }
        const review = await prisma.review.create({
            data: {
                clientName,
                rating,
                comment,
                clientEmail,
                serviceId,
                isApproved: false, // Las reseñas necesitan aprobación
                isRead: false // Nueva reseña, no ha sido leída
            }
        });
        // Enviar notificación por email al administrador
        try {
            await emailService.sendNewReviewNotification(env.EMAIL_USER, // Enviar al email del administrador configurado
            {
                id: review.id,
                clientName: review.clientName,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt
            });
            console.log(`Notificación enviada: Nueva reseña de ${clientName}`);
        }
        catch (emailError) {
            console.error('Error al enviar notificación por email:', emailError);
            // No interrumpimos el flujo si falla el email
        }
        return res.status(201).json(review);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminReply, sendNotification } = req.body;
        const updateData = {
            isApproved: true,
            isRead: true
        };
        // Si se proporciona una respuesta, la añadimos junto con la fecha
        if (adminReply) {
            updateData.adminReply = adminReply;
            updateData.replyDate = new Date();
        }
        const review = await prisma.review.update({
            where: { id },
            data: updateData
        });
        // Si se solicita enviar notificación y hay un email de cliente (opcional)
        if (sendNotification === true && req.body.clientEmail) {
            try {
                await emailService.sendReviewApprovedNotification(req.body.clientEmail, {
                    clientName: review.clientName,
                    rating: review.rating,
                    comment: review.comment,
                    adminReply: review.adminReply || undefined
                });
                console.log(`Notificación enviada: Reseña aprobada para ${review.clientName}`);
            }
            catch (emailError) {
                console.error('Error al enviar notificación de aprobación:', emailError);
                // No interrumpimos el flujo si falla el email
            }
        }
        return res.json(review);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const replyToReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminReply, sendNotification, clientEmail } = req.body;
        if (!adminReply || adminReply.trim() === '') {
            return res.status(400).json({ message: 'La respuesta no puede estar vacía' });
        }
        const review = await prisma.review.update({
            where: { id },
            data: {
                adminReply,
                replyDate: new Date(),
                isRead: true
            }
        });
        // Si se solicita enviar notificación y hay un email de cliente
        if (sendNotification === true && clientEmail) {
            try {
                await emailService.sendReviewApprovedNotification(clientEmail, {
                    clientName: review.clientName,
                    rating: review.rating,
                    comment: review.comment,
                    adminReply: review.adminReply || undefined
                });
                console.log(`Notificación enviada: Respuesta a reseña de ${review.clientName}`);
            }
            catch (emailError) {
                console.error('Error al enviar notificación de respuesta:', emailError);
                // No interrumpimos el flujo si falla el email
            }
        }
        return res.json(review);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.update({
            where: { id },
            data: {
                isRead: true
            }
        });
        return res.json(review);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const getUnreadReviewsCount = async (_req, res) => {
    try {
        const count = await prisma.review.count({
            where: {
                isRead: false
            }
        });
        return res.json({ count });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const getPendingReviewsCount = async (_req, res) => {
    try {
        const count = await prisma.review.count({
            where: {
                isApproved: false
            }
        });
        return res.json({ count });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.review.delete({
            where: { id }
        });
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
