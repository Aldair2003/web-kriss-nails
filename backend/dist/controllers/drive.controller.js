import { GoogleDriveService } from '../services/drive.service.js';
import { ImageType } from '@prisma/client';
import multer from 'multer';
import { prisma } from '../config/prisma.js';
// Configurar multer para manejar la subida de archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Límite de 5MB
    }
});
// Instanciar el servicio de Google Drive
const driveService = new GoogleDriveService();
export const driveController = {
    // Middleware para manejar la subida de archivos
    uploadMiddleware: upload.single('file'),
    uploadMultipleMiddleware: upload.array('files', 5), // Máximo 5 archivos
    // Subir múltiples archivos para un servicio
    uploadServiceImages: async (req, res) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                res.status(400).json({ error: 'No se proporcionaron archivos' });
                return;
            }
            const uploadPromises = req.files.map(async (file) => {
                // Subir a Google Drive
                const url = await driveService.uploadFileToDrive(file, ImageType.SERVICE);
                // Crear registro en la base de datos
                const image = await prisma.image.create({
                    data: {
                        url,
                        type: ImageType.SERVICE,
                        serviceId: req.body.serviceId
                    }
                });
                return image;
            });
            const images = await Promise.all(uploadPromises);
            res.status(201).json(images);
        }
        catch (error) {
            console.error('Error al subir imágenes del servicio:', error);
            res.status(500).json({ error: 'Error al subir las imágenes' });
        }
    },
    // Subir archivo
    uploadFile: async (req, res) => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No se proporcionó ningún archivo' });
                return;
            }
            const type = req.body.type || ImageType.GALLERY;
            const fileUrl = await driveService.uploadFileToDrive(req.file, type);
            res.json({
                message: 'Archivo subido exitosamente',
                url: fileUrl
            });
        }
        catch (error) {
            console.error('Error en uploadFile:', error);
            res.status(500).json({ error: 'Error al subir el archivo' });
        }
    },
    // Listar archivos
    listFiles: async (req, res) => {
        try {
            const type = req.query.type || ImageType.GALLERY;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
            const files = await driveService.listFiles(type, pageSize);
            res.json(files);
        }
        catch (error) {
            console.error('Error en listFiles:', error);
            res.status(500).json({ error: 'Error al listar los archivos' });
        }
    },
    // Eliminar archivo
    deleteFile: async (req, res) => {
        try {
            const { fileId } = req.params;
            await driveService.deleteFile(fileId);
            res.json({ message: 'Archivo eliminado exitosamente' });
        }
        catch (error) {
            console.error('Error en deleteFile:', error);
            res.status(500).json({ error: 'Error al eliminar el archivo' });
        }
    },
    // Obtener URL pública
    getPublicUrl: async (req, res) => {
        try {
            const { fileId } = req.params;
            const url = await driveService.getPublicUrl(fileId);
            res.json({ url });
        }
        catch (error) {
            console.error('Error en getPublicUrl:', error);
            res.status(500).json({ error: 'Error al obtener la URL pública' });
        }
    }
};
