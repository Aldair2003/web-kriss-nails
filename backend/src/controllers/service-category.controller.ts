import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Obtener todas las categorías de servicio
 */
export const getAllServiceCategories = async (req: Request, res: Response) => {
  try {
    // Obtenemos todas las categorías
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { services: true }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Formateamos la respuesta
    const categoriesResponse = categories.map(category => ({
      id: category.id,
      name: category.name,
      order: category.order,
      servicesCount: category._count.services,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    res.status(200).json(categoriesResponse);
  } catch (error) {
    logger.error('Error al obtener categorías de servicio', { error });
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: 'No se pudieron obtener las categorías de servicio' 
    });
  }
};

/**
 * Crear una nueva categoría
 */
export const createServiceCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }
  
  try {
    // Verificar si ya existe la categoría
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: name.trim()
      }
    });
    
    if (existingCategory) {
      return res.status(409).json({ 
        error: 'Categoría duplicada', 
        message: `Ya existe una categoría con el nombre "${name.trim()}"` 
      });
    }
    
    // Obtener el orden máximo actual
    const maxOrderCategory = await prisma.category.findFirst({
      orderBy: {
        order: 'desc'
      }
    });
    
    const nextOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;
    
    // Crear la nueva categoría
    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        order: nextOrder
      }
    });
    
    logger.info('Nueva categoría de servicio creada', { category: newCategory });
    res.status(201).json({
      ...newCategory,
      servicesCount: 0
    });
  } catch (error) {
    logger.error('Error al crear categoría de servicio', { error, name });
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: 'No se pudo crear la categoría de servicio' 
    });
  }
};

/**
 * Eliminar una categoría
 */
export const deleteServiceCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Verificar si hay servicios asociados a esta categoría
    const servicesCount = await prisma.service.count({
      where: {
        categoryId: id
      }
    });
    
    if (servicesCount > 0) {
      return res.status(400).json({
        error: 'Categoría en uso',
        message: `No se puede eliminar la categoría porque está asociada a ${servicesCount} servicios`
      });
    }
    
    // Eliminar la categoría
    const deletedCategory = await prisma.category.delete({
      where: {
        id: id
      }
    });
    
    logger.info('Categoría de servicio eliminada', { category: deletedCategory });
    res.status(200).json({
      ...deletedCategory,
      message: 'Categoría eliminada correctamente'
    });
  } catch (error) {
    logger.error('Error al eliminar categoría de servicio', { error, id });
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: 'No se pudo eliminar la categoría de servicio' 
    });
  }
}; 