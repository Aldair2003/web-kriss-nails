import { prisma } from '../config/prisma.js';
import { GoogleDriveService } from '../services/drive.service.js';
import fs from 'fs';
import path from 'path';
const driveService = new GoogleDriveService();
// Función auxiliar para subir archivos con fallback a almacenamiento local
const uploadFileWithFallback = async (file, imageType) => {
    try {
        // Primero intentar subir a Google Drive
        console.log('Intentando subir a Google Drive...');
        const driveUrl = await driveService.uploadFileToDrive(file, imageType);
        console.log('Archivo subido exitosamente a Google Drive:', driveUrl);
        return driveUrl;
    }
    catch (driveError) {
        // Si falla Google Drive, usar almacenamiento local como respaldo
        console.log('Error con Google Drive, usando almacenamiento local como respaldo:', driveError);
        // Asegurar que existe el directorio uploads
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(file.originalname);
        const fileName = `${randomStr}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        // Guardar archivo localmente
        const localPath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localPath, file.buffer);
        // Devolver URL local
        const baseUrl = process.env.NODE_ENV === 'production'
            ? `https://web-kriss-nails-production.up.railway.app`
            : 'http://localhost:3001';
        const localUrl = `${baseUrl}/uploads/${fileName}`;
        console.log('Archivo guardado localmente:', localUrl);
        return localUrl;
    }
};
// Función auxiliar para eliminar archivos (local o Google Drive)
const deleteFileWithFallback = async (fileUrl) => {
    try {
        // Verificar si es un archivo local (localhost o railway)
        if (fileUrl.includes('/uploads/')) {
            // Es un archivo local, eliminarlo del sistema de archivos
            const fileName = fileUrl.split('/uploads/')[1];
            const filePath = path.join(process.cwd(), 'uploads', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Archivo local eliminado: ${filePath}`);
            }
            else {
                console.log(`Archivo local no encontrado: ${filePath}`);
            }
        }
        else {
            // Es un archivo de Google Drive, intentar eliminarlo
            try {
                const fileId = driveService.getFileIdFromUrl(fileUrl);
                await driveService.deleteFile(fileId);
                console.log(`Archivo de Google Drive eliminado: ${fileId}`);
            }
            catch (driveError) {
                console.log(`No se pudo eliminar de Google Drive (fallback usado): ${driveError}`);
                // No lanzar error, solo registrar el fallo
            }
        }
    }
    catch (error) {
        console.error(`Error al eliminar archivo ${fileUrl}:`, error);
        // No lanzar error para no interrumpir la eliminación de la BD
    }
};
export const imageController = {
    // Obtener todas las imágenes
    getImages: async (req, res) => {
        try {
            const { isActive, type, category } = req.query;
            console.log("API getImages - Filtros recibidos:", { isActive, type, category });
            // Construir el filtro dinámico
            const filter = {};
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true';
            }
            if (type) {
                filter.type = type;
            }
            if (category) {
                filter.category = category;
            }
            // Agregar filtro para excluir las imágenes secundarias de pares antes/después
            filter.OR = [
                { isAfterImage: null },
                { isAfterImage: false }
            ];
            console.log("Filtro construido:", JSON.stringify(filter, null, 2));
            const images = await prisma.image.findMany({
                where: filter,
                orderBy: [
                    { type: 'asc' },
                    { order: 'asc' }
                ],
                include: {
                    service: true
                }
            });
            console.log(`Imágenes encontradas: ${images.length}`);
            // Log para imágenes antes/después
            const beforeAfterImages = images.filter(img => img.type === 'BEFORE_AFTER');
            if (beforeAfterImages.length > 0) {
                console.log(`Imágenes BEFORE_AFTER: ${beforeAfterImages.length}`);
                beforeAfterImages.forEach(img => {
                    console.log(`Imagen BEFORE_AFTER - ID: ${img.id}, hasAfterImage: ${!!img.beforeAfterPair}, beforeAfterPair:`, img.beforeAfterPair);
                });
            }
            res.json(images);
        }
        catch (error) {
            console.error('Error al obtener imágenes:', error);
            res.status(500).json({ error: 'Error al obtener las imágenes' });
        }
    },
    // Obtener imágenes para la galería del landing page
    getGalleryImages: async (req, res) => {
        try {
            console.log("API getGalleryImages - Obteniendo imágenes para landing page");
            // Primero, obtener todas las imágenes activas que no son "después"
            const images = await prisma.image.findMany({
                where: {
                    isActive: true,
                    // Excluir imágenes "después"
                    OR: [
                        { isAfterImage: null },
                        { isAfterImage: false }
                    ]
                },
                orderBy: [
                    { type: 'asc' },
                    { order: 'asc' }
                ],
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            category: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            console.log(`Imágenes encontradas para landing: ${images.length}`);
            // Filtrar manualmente las imágenes de tipo SERVICE para incluir solo servicios visuales
            // (con displayServiceName) o excluir los que tienen serviceId
            const filteredImages = images.filter(img => {
                // Si no es tipo SERVICE, incluirla
                if (img.type !== 'SERVICE')
                    return true;
                // Si es tipo SERVICE, verificar si es un servicio visual
                // @ts-ignore - displayServiceName no está en el tipo pero sabemos que existe
                const hasDisplayName = img.displayServiceName !== null && img.displayServiceName !== undefined;
                // Si tiene serviceId, excluirla (queremos solo servicios visuales)
                const hasServiceId = img.serviceId !== null && img.serviceId !== undefined;
                // Incluir solo si tiene displayServiceName y no tiene serviceId
                return hasDisplayName && !hasServiceId;
            });
            console.log(`Imágenes filtradas para landing (excluyendo servicios reales): ${filteredImages.length}`);
            // Log para imágenes de tipo SERVICE (servicios visuales)
            const serviceImages = filteredImages.filter(img => img.type === 'SERVICE');
            if (serviceImages.length > 0) {
                console.log(`Imágenes de SERVICIOS visuales para landing: ${serviceImages.length}`);
                serviceImages.forEach(img => {
                    // @ts-ignore - displayServiceName existe en runtime aunque TypeScript no lo sepa
                    console.log(`Servicio visual - ID: ${img.id}, displayServiceName: ${img.displayServiceName}, displayServiceCategory: ${img.displayServiceCategory}`);
                });
            }
            // Log para imágenes antes/después
            const beforeAfterImages = filteredImages.filter(img => img.type === 'BEFORE_AFTER');
            if (beforeAfterImages.length > 0) {
                console.log(`Imágenes BEFORE_AFTER para landing: ${beforeAfterImages.length}`);
                beforeAfterImages.forEach(img => {
                    console.log(`Imagen BEFORE_AFTER landing - ID: ${img.id}, hasAfterImage: ${!!img.beforeAfterPair}, beforeAfterPair:`, img.beforeAfterPair);
                });
            }
            // Formatea los datos para el frontend
            const formattedImages = filteredImages.map(img => {
                // Para imágenes de tipo SERVICE, verificar si es un servicio visual
                // @ts-ignore - displayServiceName existe en runtime
                const isVisualService = img.type === 'SERVICE' && img.displayServiceName;
                // Construir objeto con propiedades comunes
                const formattedImage = {
                    id: img.id,
                    url: img.url,
                    type: img.type,
                    title: img.title || '',
                    description: img.description || '',
                    thumbnailUrl: img.thumbnailUrl || img.url,
                    tags: img.tags || [],
                    isActive: img.isActive,
                    isHighlight: img.isHighlight || false,
                    beforeAfterPair: img.beforeAfterPair || undefined,
                    hasAfterImage: !!img.beforeAfterPair,
                    isAfterImage: img.isAfterImage || false,
                    beforeImageId: img.beforeImageId || undefined
                };
                if (isVisualService) {
                    // Para servicios visuales, usar los campos display
                    formattedImage.displayServiceName = img.displayServiceName;
                    formattedImage.displayServiceCategory = img.displayServiceCategory;
                    formattedImage.serviceName = img.displayServiceName;
                    formattedImage.category = img.category || ''; // Usar category para la descripción debajo del título
                }
                else {
                    // Para otros tipos de imágenes, usar los campos normales
                    formattedImage.category = img.category || (img.service?.category?.name || '');
                    formattedImage.serviceId = img.serviceId || undefined;
                    formattedImage.serviceName = img.service?.name || undefined;
                    formattedImage.servicePrice = img.service?.price || undefined;
                }
                return formattedImage;
            });
            console.log("Imágenes formateadas para respuesta:", formattedImages.length);
            res.json(formattedImages);
        }
        catch (error) {
            console.error('Error al obtener imágenes de la galería:', error);
            res.status(500).json({ error: 'Error al obtener las imágenes de la galería' });
        }
    },
    // Obtener imágenes de antes/después
    getBeforeAfterImages: async (req, res) => {
        try {
            const images = await prisma.image.findMany({
                where: {
                    type: 'BEFORE_AFTER',
                    isActive: true
                },
                orderBy: { order: 'asc' }
            });
            res.json(images);
        }
        catch (error) {
            console.error('Error al obtener imágenes antes/después:', error);
            res.status(500).json({ error: 'Error al obtener las imágenes antes/después' });
        }
    },
    // Obtener imágenes por servicio
    getServiceImages: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const images = await prisma.image.findMany({
                where: {
                    serviceId,
                    isActive: true
                },
                orderBy: { order: 'asc' }
            });
            res.json(images);
        }
        catch (error) {
            console.error('Error al obtener imágenes del servicio:', error);
            res.status(500).json({ error: 'Error al obtener las imágenes del servicio' });
        }
    },
    getImageById: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Buscando imagen con ID:', id);
            const image = await prisma.image.findUnique({
                where: { id },
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            category: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            if (!image) {
                console.log('Imagen no encontrada con ID:', id);
                res.status(404).json({ message: 'Imagen no encontrada' });
                return;
            }
            console.log('Imagen encontrada:', image);
            // Verificar si es un servicio visual
            const isVisualService = image.type === 'SERVICE' && image.displayServiceName;
            // Formatea los datos para el frontend
            const formattedImage = {
                id: image.id,
                url: image.url,
                type: image.type,
                title: image.title || '',
                description: image.description || '',
                beforeAfterPair: image.beforeAfterPair || undefined,
                thumbnailUrl: image.thumbnailUrl || image.url,
                tags: image.tags || [],
                isActive: image.isActive,
                isHighlight: image.isHighlight || false,
                order: image.order || 0
            };
            if (isVisualService) {
                // Para servicios visuales, usar los campos display
                formattedImage.displayServiceName = image.displayServiceName;
                formattedImage.displayServiceCategory = image.displayServiceCategory;
                formattedImage.serviceName = image.displayServiceName;
                formattedImage.category = image.category || ''; // Usar category para la descripción debajo del título
            }
            else {
                // Para otros tipos de imágenes, usar los campos normales
                formattedImage.category = image.category || (image.service?.category?.name || '');
                formattedImage.serviceId = image.serviceId || undefined;
                formattedImage.serviceName = image.service?.name || undefined;
                formattedImage.servicePrice = image.service?.price || undefined;
            }
            console.log('Imagen formateada para enviar:', formattedImage);
            res.json(formattedImage);
        }
        catch (error) {
            console.error('Error al obtener la imagen:', error);
            res.status(500).json({ error: 'Error al obtener la imagen' });
        }
    },
    createImage: async (req, res) => {
        try {
            console.log('📸 Iniciando createImage');
            console.log('📋 Headers recibidos:', Object.keys(req.headers));
            console.log('📋 Content-Type:', req.headers['content-type']);
            console.log('📄 Body recibido:', req.body);
            // Obtener el archivo de req.files o req.file
            const file = req.files && Array.isArray(req.files) && req.files.length > 0
                ? req.files[0]
                : req.file;
            console.log('📁 File recibido:', file ? {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                fieldname: file.fieldname
            } : 'No hay archivo');
            console.log('📁 req.files:', req.files);
            if (!file) {
                console.log('❌ No se proporcionó ningún archivo');
                res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
                return;
            }
            const { type, category, serviceId, title, description, order, isHighlight, tags, isAfterImage, beforeImageId, displayServiceName, // Nuevo campo para nombre de servicio visual
            displayServiceCategory // Nuevo campo para categoría de servicio visual
             } = req.body;
            console.log("API createImage - Creando imagen con parámetros:", {
                type,
                category,
                serviceId,
                title,
                isAfterImage: isAfterImage === 'true' ? true : false,
                beforeImageId,
                displayServiceName,
                displayServiceCategory
            });
            // Subir archivo con fallback a almacenamiento local
            const url = await uploadFileWithFallback(file, type);
            console.log("Imagen subida exitosamente, URL:", url);
            // Crear versión en miniatura si es necesario (solo para archivos de Google Drive)
            let thumbnailUrl = null;
            if (file.size > 500000 && !url.includes('/uploads/')) {
                try {
                    thumbnailUrl = await driveService.createThumbnail(url);
                }
                catch (error) {
                    console.log('No se pudo crear miniatura, usando imagen original:', error);
                    thumbnailUrl = null;
                }
            }
            // Procesar tags si existen
            const processedTags = tags ? JSON.parse(tags) : [];
            // Guardar referencia en la base de datos
            const image = await prisma.image.create({
                data: {
                    url,
                    thumbnailUrl,
                    type: type,
                    category,
                    title,
                    description,
                    order: order ? parseInt(order) : 0,
                    isHighlight: isHighlight === 'true',
                    tags: processedTags,
                    dimensions: file ? {
                        size: file.size,
                        mimetype: file.mimetype
                    } : undefined,
                    isAfterImage: isAfterImage === 'true' ? true : false,
                    beforeImageId: beforeImageId || null,
                    displayServiceName: type === 'SERVICE' ? displayServiceName : null, // Guardar nombre de servicio visual
                    displayServiceCategory: type === 'SERVICE' ? displayServiceCategory : null, // Guardar categoría de servicio visual
                    ...(serviceId && { serviceId })
                },
                include: {
                    service: true
                }
            });
            console.log("Imagen creada en base de datos:", {
                id: image.id,
                type: image.type,
                isAfterImage: image.isAfterImage,
                beforeImageId: image.beforeImageId,
                // Solo registramos estos campos en el log si es de tipo SERVICE
                ...(image.type === 'SERVICE' && {
                    displayServiceName: image.displayServiceName,
                    displayServiceCategory: image.displayServiceCategory
                })
            });
            res.status(201).json(image);
        }
        catch (error) {
            console.error('Error al crear la imagen:', error);
            res.status(500).json({ message: 'Error al crear la imagen' });
        }
    },
    // Crear imagen de antes/después
    createBeforeAfterImage: async (req, res) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length !== 2) {
                res.status(400).json({ message: 'Se requieren exactamente dos imágenes (antes y después)' });
                return;
            }
            const { category, title, description, order } = req.body;
            // Subir ambas imágenes con fallback a almacenamiento local
            const beforeUrl = await uploadFileWithFallback(req.files[0], 'BEFORE_AFTER');
            const afterUrl = await uploadFileWithFallback(req.files[1], 'BEFORE_AFTER');
            // Guardar referencia en la base de datos
            const image = await prisma.image.create({
                data: {
                    url: beforeUrl, // La URL principal es la del antes
                    type: 'BEFORE_AFTER',
                    category,
                    title,
                    description,
                    order: order ? parseInt(order) : 0,
                    beforeAfterPair: {
                        before: beforeUrl,
                        after: afterUrl
                    }
                }
            });
            res.status(201).json(image);
        }
        catch (error) {
            console.error('Error al crear la imagen antes/después:', error);
            res.status(500).json({ message: 'Error al crear la imagen antes/después' });
        }
    },
    updateImage: async (req, res) => {
        try {
            const { id } = req.params;
            const { category, type, title, description, order, isActive, isHighlight, tags, serviceId, beforeAfterPair, hasAfterImage, displayServiceName, // Nombre del servicio visual
            displayServiceCategory // Categoría del servicio visual
             } = req.body;
            console.log("API updateImage - Datos recibidos:", {
                id,
                type,
                displayServiceName,
                displayServiceCategory,
                category,
                title,
                description
            });
            // Obtener imagen actual para comparar cambios
            const currentImage = await prisma.image.findUnique({
                where: { id }
            });
            console.log("Estado actual de la imagen:", {
                id: currentImage?.id,
                type: currentImage?.type,
                displayServiceName: currentImage.displayServiceName,
                displayServiceCategory: currentImage.displayServiceCategory
            });
            // Procesar tags si existen
            const processedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined;
            const updateData = {
                isActive: isActive !== undefined ?
                    (typeof isActive === 'string' ? isActive === 'true' : isActive) :
                    undefined,
                isHighlight: isHighlight !== undefined ?
                    (typeof isHighlight === 'string' ? isHighlight === 'true' : isHighlight) :
                    undefined,
                tags: processedTags,
                beforeAfterPair: beforeAfterPair || undefined,
            };
            // Si es un servicio visual, actualizar sus campos específicos
            if (currentImage?.type === 'SERVICE') {
                console.log("Actualizando servicio visual con:", {
                    displayServiceName,
                    displayServiceCategory,
                    category // Este será la descripción que aparece debajo del título
                });
                updateData.displayServiceName = displayServiceName;
                updateData.displayServiceCategory = displayServiceCategory;
                updateData.category = category; // Mantener category para la descripción
                // Para servicios visuales, no actualizamos title ni description
                // ya que estos campos no se usan en la visualización
            }
            else {
                // Para otros tipos de imágenes, actualizar campos normales
                updateData.category = category;
                updateData.title = title;
                updateData.description = description;
                updateData.serviceId = serviceId || null;
            }
            console.log("Datos a actualizar:", updateData);
            const image = await prisma.image.update({
                where: { id },
                data: updateData,
                include: {
                    service: true
                }
            });
            console.log("Imagen actualizada exitosamente:", {
                id: image.id,
                type: image.type,
                displayServiceName: image.displayServiceName,
                displayServiceCategory: image.displayServiceCategory
            });
            res.json(image);
        }
        catch (error) {
            console.error('Error al actualizar la imagen:', error);
            res.status(500).json({ message: 'Error al actualizar la imagen' });
        }
    },
    deleteImage: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`Iniciando eliminación de imagen: ${id}`);
            // Obtener la imagen
            const image = await prisma.image.findUnique({
                where: { id }
            });
            if (!image) {
                console.log(`Imagen no encontrada: ${id}`);
                res.status(404).json({ message: 'Imagen no encontrada' });
                return;
            }
            console.log(`Imagen encontrada: ${image.type}, URL: ${image.url}`);
            // Eliminar archivo principal
            if (image.url) {
                await deleteFileWithFallback(image.url);
            }
            // Si tiene miniatura, eliminarla también
            if (image.thumbnailUrl) {
                await deleteFileWithFallback(image.thumbnailUrl);
            }
            // Si es una imagen before/after, eliminar ambas imágenes
            if (image.type === 'BEFORE_AFTER' && image.beforeAfterPair) {
                const beforeAfterData = image.beforeAfterPair;
                console.log('Eliminando imágenes antes/después:', beforeAfterData);
                if (beforeAfterData.before) {
                    await deleteFileWithFallback(beforeAfterData.before);
                }
                if (beforeAfterData.after) {
                    await deleteFileWithFallback(beforeAfterData.after);
                }
            }
            // Eliminar de la base de datos
            console.log(`Eliminando imagen de la base de datos: ${id}`);
            await prisma.image.delete({
                where: { id }
            });
            console.log(`Imagen eliminada exitosamente: ${id}`);
            res.status(204).send();
        }
        catch (error) {
            console.error('Error al eliminar la imagen:', error);
            res.status(500).json({ message: 'Error al eliminar la imagen' });
        }
    }
};
