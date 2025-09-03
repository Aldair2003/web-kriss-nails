import { GoogleDriveService } from '../services/drive.service.js';
import { ImageType } from '@prisma/client';
import multer from 'multer';
import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
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
        console.log('📸 Iniciando subida de imágenes de servicio');
        console.log('📋 Headers recibidos:', req.headers);
        console.log('🔐 Authorization:', req.headers.authorization ? 'Presente' : 'Ausente');
        console.log('📄 Files recibidos:', req.files ? `${req.files.length} archivos` : 'Sin archivos');
        const files = req.files;
        const { serviceId } = req.body;
        logger.info(`Iniciando carga de imágenes para servicio`, {
            serviceId: serviceId || 'no proporcionado',
            filesCount: files?.length || 0
        });
        if (!files || files.length === 0) {
            logger.warn('No se proporcionaron archivos para subir');
            res.status(400).json({
                success: false,
                message: 'No se proporcionaron archivos para subir'
            });
            return;
        }
        if (!serviceId) {
            logger.warn('No se proporcionó el ID del servicio');
            res.status(400).json({
                success: false,
                message: 'No se proporcionó el ID del servicio'
            });
            return;
        }
        try {
            // Obtener el nombre del servicio
            const service = await prisma.service.findUnique({
                where: { id: serviceId },
                select: { name: true }
            });
            if (!service) {
                logger.warn('Servicio no encontrado');
                res.status(404).json({
                    success: false,
                    message: 'Servicio no encontrado'
                });
                return;
            }
            logger.info('Información del servicio encontrada:', {
                serviceId,
                serviceName: service.name
            });
            logger.debug(`Procesando ${files.length} archivos para el servicio ${service.name}`);
            const uploadPromises = files.map(async (file) => {
                logger.info(`Procesando archivo para servicio:`, {
                    fileName: file.originalname,
                    fileSize: file.size,
                    serviceName: service.name,
                    serviceId
                });
                try {
                    const imageUrl = await driveService.uploadFileToDrive(file, ImageType.SERVICE, {
                        serviceName: service.name
                    });
                    logger.info(`URL de imagen generada:`, { imageUrl });
                    // Crear la imagen en la base de datos
                    const image = await prisma.image.create({
                        data: {
                            url: imageUrl,
                            type: ImageType.SERVICE,
                            serviceId: serviceId
                        }
                    });
                    logger.info(`Archivo subido y guardado en BD:`, {
                        imageId: image.id,
                        imageUrl: image.url,
                        serviceName: service.name
                    });
                    return image;
                }
                catch (error) {
                    logger.error(`Error al subir archivo ${file.originalname}:`, error);
                    throw error;
                }
            });
            const uploadedImages = await Promise.all(uploadPromises);
            logger.info(`Se subieron ${uploadedImages.length} imágenes correctamente para el servicio ${service.name}`);
            res.status(201).json(uploadedImages);
            return;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar las imágenes';
            logger.error('Error al procesar las imágenes:', { error, message: errorMessage });
            res.status(500).json({
                success: false,
                message: 'Error al procesar las imágenes',
                error: errorMessage
            });
            return;
        }
    },
    // Subir archivo temporal
    uploadFile: async (req, res) => {
        try {
            const files = req.files;
            if (!files || files.length === 0) {
                logger.warn('No se proporcionaron archivos para subir');
                res.status(400).json({
                    success: false,
                    message: 'No se proporcionaron archivos para subir'
                });
                return;
            }
            // Asegurarnos de que sea tipo TEMP para subidas temporales
            const type = ImageType.TEMP;
            logger.info(`Iniciando carga de ${files.length} archivos temporales`);
            const uploadPromises = files.map(async (file) => {
                try {
                    logger.info(`Procesando archivo temporal: ${file.originalname}`);
                    const fileUrl = await driveService.uploadFileToDrive(file, type);
                    // Crear una imagen temporal en la base de datos
                    const image = await prisma.image.create({
                        data: {
                            url: fileUrl,
                            type: type
                        }
                    });
                    logger.info(`Archivo temporal ${file.originalname} subido exitosamente`);
                    return image;
                }
                catch (error) {
                    logger.error(`Error al procesar archivo temporal ${file.originalname}:`, error);
                    throw error;
                }
            });
            const uploadedImages = await Promise.all(uploadPromises);
            logger.info(`Se subieron ${uploadedImages.length} archivos temporales correctamente`);
            res.status(201).json(uploadedImages);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar las imágenes';
            logger.error('Error en uploadFile:', { error, message: errorMessage });
            res.status(500).json({
                success: false,
                message: 'Error al subir los archivos',
                error: errorMessage
            });
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
