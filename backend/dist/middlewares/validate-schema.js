import { ZodError } from 'zod';
export const validateSchema = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            return next();
        }
        catch (error) {
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
