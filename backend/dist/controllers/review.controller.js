import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const getReviews = async (_req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            where: {
                isApproved: true
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
        const { clientName, rating, comment } = req.body;
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
        }
        const review = await prisma.review.create({
            data: {
                clientName,
                rating,
                comment,
                isApproved: false // Las reseñas necesitan aprobación
            }
        });
        return res.status(201).json(review);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.update({
            where: { id },
            data: {
                isApproved: true
            }
        });
        return res.json(review);
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
