import { prisma } from '../config/prisma.js';
import { GoogleDriveService } from '../services/drive.service.js';
const driveService = new GoogleDriveService();
export const imageController = {
    // Obtener todas las imágenes
    getImages: async (req, res) => {
        try {
            const { category, type } = req.query;
            // Construir el objeto where para el filtro
            const where = {
                ...(category && { category: category }),
                ...(type && { type: type })
            };
            const images = await prisma.image.findMany({ where });
            res.json(images);
        }
        catch (error) {
            console.error('Error al obtener imágenes:', error);
            res.status(500).json({ error: 'Error al obtener las imágenes' });
        }
    },
    createImage: async (req, res) => {
        try {
            if (!req.file) {
                res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
                return;
            }
            const { type, category, serviceId } = req.body;
            // Subir archivo a Google Drive
            const url = await driveService.uploadFileToDrive(req.file, type);
            // Guardar referencia en la base de datos
            const image = await prisma.image.create({
                data: {
                    url,
                    type: type,
                    category,
                    ...(serviceId && { serviceId })
                },
                include: {
                    service: true
                }
            });
            res.status(201).json(image);
        }
        catch (error) {
            console.error('Error al crear la imagen:', error);
            res.status(500).json({ message: 'Error al crear la imagen' });
        }
    },
    updateImage: async (req, res) => {
        try {
            const { id } = req.params;
            const { category, type } = req.body;
            const image = await prisma.image.update({
                where: { id },
                data: {
                    category,
                    type
                },
                include: {
                    service: true
                }
            });
            res.json(image);
        }
        catch (error) {
            res.status(500).json({ message: 'Error al actualizar la imagen' });
        }
    },
    deleteImage: async (req, res) => {
        try {
            const { id } = req.params;
            // Obtener la imagen
            const image = await prisma.image.findUnique({
                where: { id }
            });
            if (!image) {
                res.status(404).json({ message: 'Imagen no encontrada' });
                return;
            }
            // Eliminar de Google Drive
            const fileId = driveService.getFileIdFromUrl(image.url);
            await driveService.deleteFile(fileId);
            // Eliminar de la base de datos
            await prisma.image.delete({
                where: { id }
            });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ message: 'Error al eliminar la imagen' });
        }
    }
};
