import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateSchema } from '../middlewares/validate-schema.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
const router = Router();
// Rutas públicas
router.post('/login', validateSchema(loginSchema), authController.login);
router.post('/register', validateSchema(registerSchema), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
export { router as authRouter };
