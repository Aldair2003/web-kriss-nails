import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { logger } from '../config/logger.js';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ejecutar todas las validaciones
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Log de errores de validación
    logger.warn('Validation error', {
      path: req.path,
      errors: errors.array()
    });

    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors: errors.array().map((err: ValidationError) => ({
        field: err.type === 'field' ? err.path : err.type,
        message: err.msg
      }))
    });
  };
}; 