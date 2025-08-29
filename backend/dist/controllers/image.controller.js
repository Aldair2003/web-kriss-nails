import { prisma } from '../config/prisma.js';
import { GoogleDriveService } from '../services/drive.service.js';
const driveService = new GoogleDriveService();
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
                    // Para servicios visuales, usar los campos displayService*
                    // @ts-ignore - Los campos existen en runtime aunque TypeScript no lo sepa
                    formattedImage.category = img.displayServiceCategory || '';
                    // @ts-ignore
                    formattedImage.serviceName = img.displayServiceName;
                    // @ts-ignore
                    formattedImage.displayServiceName = img.displayServiceName;
                    // @ts-ignore
                    formattedImage.displayServiceCategory = img.displayServiceCategory;
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
            // Formatea los datos para el frontend
            const formattedImage = {
                id: image.id,
                url: image.url,
                type: image.type,
                category: image.category || (image.service?.category?.name || ''),
                title: image.title || '',
                description: image.description || '',
                serviceId: image.serviceId || undefined,
                serviceName: image.service?.name || undefined,
                servicePrice: image.service?.price || undefined,
                beforeAfterPair: image.beforeAfterPair || undefined,
                thumbnailUrl: image.thumbnailUrl || image.url,
                tags: image.tags || [],
                isActive: image.isActive,
                isHighlight: image.isHighlight || false,
                order: image.order || 0
            };
            res.json(formattedImage);
        }
        catch (error) {
            console.error('Error al obtener la imagen:', error);
            res.status(500).json({ error: 'Error al obtener la imagen' });
        }
    },
    createImage: async (req, res) => {
        try {
            if (!req.file) {
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
            // Subir archivo a Google Drive
            const url = await driveService.uploadFileToDrive(req.file, type);
            console.log("Imagen subida a Drive, URL:", url);
            // Crear versión en miniatura si es necesario
            let thumbnailUrl = null;
            if (req.file.size > 500000) { // Si el archivo es mayor a 500kb
                thumbnailUrl = await driveService.createThumbnail(url);
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
                    dimensions: req.file ? {
                        size: req.file.size,
                        mimetype: req.file.mimetype
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
            // Subir ambas imágenes
            const beforeUrl = await driveService.uploadFileToDrive(req.files[0], 'BEFORE_AFTER');
            const afterUrl = await driveService.uploadFileToDrive(req.files[1], 'BEFORE_AFTER');
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
            const { category, type, title, description, order, isActive, isHighlight, tags, serviceId, beforeAfterPair, hasAfterImage, displayServiceName, // Nuevo campo para nombre de servicio visual
            displayServiceCategory // Nuevo campo para categoría de servicio visual
             } = req.body;
            console.log("API updateImage - Actualizando imagen:", {
                id,
                hasAfterImage,
                beforeAfterPair,
                isHighlight,
                isHighlightType: typeof isHighlight,
                displayServiceName,
                displayServiceCategory
            });
            // Procesar tags si existen
            const processedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined;
            const updateData = {
                category,
                type: type,
                title,
                description,
                order: order !== undefined ? parseInt(order) : undefined,
                isActive: isActive !== undefined ?
                    (typeof isActive === 'string' ? isActive === 'true' : isActive) :
                    undefined,
                isHighlight: isHighlight !== undefined ?
                    (typeof isHighlight === 'string' ? isHighlight === 'true' : isHighlight) :
                    undefined,
                tags: processedTags,
                serviceId: serviceId || null,
                beforeAfterPair: beforeAfterPair || undefined,
            };
            // Añadir campos para servicios visuales
            if (type === 'SERVICE') {
                updateData.displayServiceName = displayServiceName;
                updateData.displayServiceCategory = displayServiceCategory;
            }
            const image = await prisma.image.update({
                where: { id },
                data: updateData,
                include: {
                    service: true
                }
            });
            // Guardamos el log de toda la operación
            console.log("Imagen actualizada:", {
                id: image.id,
                beforeAfterPair: image.beforeAfterPair,
                isAfterImage: image.isAfterImage,
                beforeImageId: image.beforeImageId,
                hasAfterImage, // Solo para el log, no se guarda en la BD
                // Solo registramos estos campos en el log si es de tipo SERVICE
                ...(image.type === 'SERVICE' && {
                    displayServiceName: image.displayServiceName,
                    displayServiceCategory: image.displayServiceCategory
                })
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
            // Si tiene miniatura, eliminarla también
            if (image.thumbnailUrl) {
                const thumbnailId = driveService.getFileIdFromUrl(image.thumbnailUrl);
                await driveService.deleteFile(thumbnailId);
            }
            // Si es una imagen before/after, eliminar la imagen "before" también
            if (image.type === 'BEFORE_AFTER' && image.beforeAfterPair) {
                const beforeAfterData = image.beforeAfterPair;
                if (beforeAfterData.before) {
                    const beforeId = driveService.getFileIdFromUrl(beforeAfterData.before);
                    await driveService.deleteFile(beforeId);
                }
            }
            // Eliminar de la base de datos
            await prisma.image.delete({
                where: { id }
            });
            res.status(204).send();
        }
        catch (error) {
            console.error('Error al eliminar la imagen:', error);
            res.status(500).json({ message: 'Error al eliminar la imagen' });
        }
    }
};
