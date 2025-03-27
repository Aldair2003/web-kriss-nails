import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateSchema } from '../middlewares/validate-schema.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const router = Router();

// Rutas públicas
router.post('/login', validateSchema(loginSchema), authController.login as any);
router.post('/register', validateSchema(registerSchema), authController.register as any);
router.post('/refresh', authController.refresh as any);
router.post('/logout', authController.logout as any);

export { router as authRouter }; 