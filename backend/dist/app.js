import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config.js';
import corsOptions from './config/cors.config.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { imageRouter } from './routes/image.routes.js';
import { driveRouter } from './routes/drive.routes.js';
import { availabilityRouter } from './routes/availability.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { appointmentRouter } from './routes/appointment.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import { serviceRouter } from './routes/service.routes.js';
import { errorHandler } from './config/error.handler.js';
import categoryRoutes from './routes/category.routes.js';
import serviceCategoryRoutes from './routes/service-category.routes.js';
const app = express();
// Seguridad
app.use(helmet());
// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // límite de 1000 peticiones por ventana por IP
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos'
});
app.use(limiter);
// Compresión de respuestas
app.use(compression());
// Middlewares básicos
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Rachell Nails',
}));
console.log('📚 Documentación Swagger disponible en: http://localhost:3001/api-docs');
// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/images', imageRouter);
app.use('/api/drive', driveRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/services', serviceRouter);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/categories', categoryRoutes);
// Ruta de prueba
app.get('/api/health', (_, res) => {
    res.json({ message: 'Backend funcionando correctamente' });
});
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Middleware de manejo de errores (debe ir después de las rutas)
app.use((err, req, res, next) => {
    errorHandler(err, req, res, next);
});
export default app;
