import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Result, ValidationError } from 'express-validator';

// Clase personalizada para errores de la aplicación
export class AppError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'AppError';
  }
}

// Función para crear errores de validación
export const createValidationError = (errors: Result<ValidationError>) => {
  return new AppError('Error de validación', 400, errors.array());
};

// Función para crear error de no encontrado
export const createNotFoundError = (resource: string) => {
  return new AppError(`${resource} no encontrado`, 404);
};

// Función para crear error de no autorizado
export const createUnauthorizedError = (message = 'No autorizado') => {
  return new AppError(message, 401);
};

// Función para crear error de acceso prohibido
export const createForbiddenError = (message = 'Acceso denegado') => {
  return new AppError(message, 403);
};

interface CustomError extends Error {
  errors?: any[];
  statusCode?: number;
}

// Manejador de errores centralizado
export const errorHandler = (
  error: CustomError | PrismaClientKnownRequestError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', error);

  // Error personalizado de la aplicación
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(error.errors && { errors: error.errors })
    });
  }

  // Error de Prisma
  if (error instanceof PrismaClientKnownRequestError) {
    return res.status(400).json({
      status: 'error',
      message: 'Error en la base de datos',
      error: error.message,
    });
  }

  // Error con array de errores (validación)
  if (error.errors) {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors: error.errors
    });
  }

  // Error no controlado
  return res.status(500).json({
    status: 'error',
    message: error.message || 'Error interno del servidor'
  });
}; 