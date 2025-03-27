import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();
export const getCategories = async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                services: {
                    include: {
                        images: true
                    }
                }
            },
            orderBy: {
                order: 'asc'
            }
        });
        return res.json(categories);
    }
    catch (error) {
        console.error('Error al obtener categorías:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                services: {
                    include: {
                        images: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        return res.json(category);
    }
    catch (error) {
        console.error('Error al obtener categoría:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        // Obtener el último orden
        const lastCategory = await prisma.category.findFirst({
            orderBy: {
                order: 'desc'
            }
        });
        const category = await prisma.category.create({
            data: {
                name,
                order: lastCategory ? lastCategory.order + 1 : 0
            }
        });
        return res.status(201).json(category);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
            }
        }
        console.error('Error al crear categoría:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await prisma.category.update({
            where: { id },
            data: { name }
        });
        return res.json(category);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
            }
        }
        console.error('Error al actualizar categoría:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({
            where: { id }
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error al eliminar categoría:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
export const updateCategoryOrder = async (req, res) => {
    try {
        const { categories } = req.body;
        // Actualizar el orden de múltiples categorías
        await prisma.$transaction(categories.map((cat) => prisma.category.update({
            where: { id: cat.id },
            data: { order: cat.order }
        })));
        return res.json({ message: 'Orden actualizado correctamente' });
    }
    catch (error) {
        console.error('Error al actualizar orden:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
};
