import { Request, Response } from 'express';
import { PrismaClient, Prisma, ImageType } from '@prisma/client';
import { formatDuration, parseDuration, isValidDuration } from '../utils/duration.js';

const prisma = new PrismaClient();

export const getServices = async (req: Request, res: Response) => {
  try {
    const { 
      categoryId, 
      isActive, 
      isHighlight,
      hasOffer,
      minPrice,
      maxPrice,
      search,
      page = '1',
      limit = '10',
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    console.log('Recibiendo petición de búsqueda:', {
      search,
      isActive,
      isHighlight,
      hasOffer,
      categoryId
    });

    // Convertir parámetros de paginación a números
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir el objeto where con todos los filtros
    const where: Prisma.ServiceWhereInput = {
      ...(categoryId && { categoryId: String(categoryId) }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(isHighlight !== undefined && { isHighlight: isHighlight === 'true' }),
      ...(hasOffer !== undefined && { hasOffer: hasOffer === 'true' }),
      ...(search && {
        OR: [
          { 
            name: { 
              contains: search as string,
              mode: 'insensitive' as Prisma.QueryMode 
            }
          },
          { 
            description: { 
              contains: search as string,
              mode: 'insensitive' as Prisma.QueryMode 
            }
          }
        ]
      })
    };

    console.log('Filtros aplicados:', where);

    // Manejar el filtro de precio
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: new Prisma.Decimal(minPrice as string) }),
        ...(maxPrice && { lte: new Prisma.Decimal(maxPrice as string) })
      };
    }

    // Obtener el total de servicios para la paginación
    const total = await prisma.service.count({ where });

    // Construir el objeto de ordenamiento
    const orderBy: Prisma.ServiceOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder as Prisma.SortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder as Prisma.SortOrder;
    } else {
      orderBy.order = sortOrder as Prisma.SortOrder;
    }

    // Obtener los servicios con paginación
    const services = await prisma.service.findMany({
      where,
      include: {
        images: true,
        category: true
      },
      orderBy,
      skip,
      take: limitNum
    });
    
    console.log(`Encontrados ${services.length} servicios`);
    
    // Formatear la duración en la respuesta
    const formattedServices = services.map(service => ({
      ...service,
      duration: formatDuration(service.duration)
    }));
    
    // Devolver los servicios con metadatos de paginación
    return res.json({
      services: formattedServices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        images: true,
        category: true
      }
    });

    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Formatear la duración en la respuesta
    return res.json({
      ...service,
      duration: formatDuration(service.duration)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      price, 
      duration, 
      categoryId,
      isActive = true,
      isHighlight = false,
      hasOffer = false,
      offerPrice,
      images = []
    } = req.body;

    // Validar el formato de duración
    if (!isValidDuration(duration)) {
      return res.status(400).json({ 
        message: 'Formato de duración inválido. Use HH:MM o formato decimal (ej: 2.5)' 
      });
    }

    // Validar precio de oferta
    if (hasOffer && !offerPrice) {
      return res.status(400).json({ 
        message: 'El precio de oferta es requerido cuando hasOffer es true' 
      });
    }

    if (hasOffer && new Prisma.Decimal(offerPrice).gte(new Prisma.Decimal(price))) {
      return res.status(400).json({ 
        message: 'El precio de oferta debe ser menor al precio regular' 
      });
    }

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({ message: 'Categoría no encontrada' });
    }

    // Obtener el último orden en la categoría
    const lastService = await prisma.service.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' }
    });

    // Convertir duración a minutos
    const durationInMinutes = parseDuration(duration);

    // Crear el servicio y actualizar las imágenes en una transacción
    const service = await prisma.$transaction(async (tx) => {
      // 1. Crear el servicio
      const newService = await tx.service.create({
        data: {
          name,
          description,
          price: new Prisma.Decimal(price),
          duration: durationInMinutes,
          categoryId,
          isActive,
          isHighlight,
          hasOffer,
          ...(hasOffer && { offerPrice: new Prisma.Decimal(offerPrice) }),
          order: lastService ? lastService.order + 1 : 0
        },
        include: {
          category: true
        }
      });

      // 2. Si hay imágenes, actualizar su tipo y asociarlas al servicio
      if (images && images.length > 0) {
        await tx.image.updateMany({
          where: {
            id: {
              in: images.map((img: { id: string }) => img.id)
            }
          },
          data: {
            type: ImageType.SERVICE,
            serviceId: newService.id
          }
        });
      }

      // 3. Retornar el servicio con las imágenes actualizadas
      return tx.service.findUnique({
        where: { id: newService.id },
        include: {
          category: true,
          images: true
        }
      });
    });

    if (!service) {
      throw new Error('Error al crear el servicio');
    }

    // Devolver servicio con duración formateada
    return res.status(201).json({
      ...service,
      duration: formatDuration(service.duration)
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      duration, 
      categoryId,
      isActive,
      isHighlight,
      hasOffer,
      offerPrice,
      images
    } = req.body;

    // Verificar si el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Validar el formato de duración si se proporciona
    if (duration && !isValidDuration(duration)) {
      return res.status(400).json({ 
        message: 'Formato de duración inválido. Use HH:MM o formato decimal (ej: 2.5)' 
      });
    }

    // Validar precio de oferta
    if (hasOffer && offerPrice === undefined) {
      return res.status(400).json({ 
        message: 'El precio de oferta es requerido cuando hasOffer es true' 
      });
    }

    // Si se proporciona precio y precio de oferta, validar que el precio de oferta sea menor
    if (offerPrice !== undefined && price !== undefined) {
      if (new Prisma.Decimal(offerPrice).gte(new Prisma.Decimal(price))) {
        return res.status(400).json({ 
          message: 'El precio de oferta debe ser menor al precio regular' 
        });
      }
    } else if (offerPrice !== undefined) {
      if (new Prisma.Decimal(offerPrice).gte(existingService.price)) {
        return res.status(400).json({ 
          message: 'El precio de oferta debe ser menor al precio regular' 
        });
      }
    }

    // Si se proporciona categoryId, verificar que existe
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return res.status(400).json({ message: 'Categoría no encontrada' });
      }
    }

    // Convertir duración a minutos si se proporciona
    const durationInMinutes = duration ? parseDuration(duration) : undefined;

    // Actualizar el servicio y sus imágenes en una transacción
    const updatedService = await prisma.$transaction(async (tx) => {
      // Si hay nuevas imágenes, eliminar las antiguas y crear las nuevas
      if (images) {
        // Eliminar imágenes antiguas
        await tx.image.deleteMany({
          where: { serviceId: id }
        });

        // Crear nuevas imágenes sin especificar el ID
        await tx.image.createMany({
          data: images.map((image: { id: string; url: string }) => ({
            url: image.url,
            serviceId: id,
            type: ImageType.SERVICE
          }))
        });
      }

      // Actualizar el servicio
      return tx.service.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(price && { price: new Prisma.Decimal(price) }),
          ...(durationInMinutes && { duration: durationInMinutes }),
          ...(categoryId && { categoryId }),
          ...(isActive !== undefined && { isActive }),
          ...(isHighlight !== undefined && { isHighlight }),
          ...(hasOffer !== undefined && { 
            hasOffer,
            // Si hasOffer es false, eliminar el precio de oferta
            ...(hasOffer === false && { offerPrice: null })
          }),
          ...(offerPrice !== undefined && { offerPrice: new Prisma.Decimal(offerPrice) })
        },
        include: {
          category: true,
          images: true
        }
      });
    });

    // Devolver servicio con duración formateada
    return res.json({
      ...updatedService,
      duration: formatDuration(updatedService.duration)
    });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateServiceOrder = async (req: Request, res: Response) => {
  try {
    const { services } = req.body;

    // Actualizar el orden de múltiples servicios
    await prisma.$transaction(
      services.map((svc: { id: string; order: number }) =>
        prisma.service.update({
          where: { id: svc.id },
          data: { order: svc.order }
        })
      )
    );

    return res.json({ message: 'Orden actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}; 