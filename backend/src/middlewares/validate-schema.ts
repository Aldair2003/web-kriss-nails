import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateSchema = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Error de validación',
          errors: error.errors
        });
        return;
      }
      res.status(400).json({
        message: 'Error de validación desconocido'
      });
      return;
    }
  };
}; 