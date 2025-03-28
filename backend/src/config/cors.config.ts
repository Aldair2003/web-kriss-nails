import { CorsOptions } from 'cors';
import { env } from './env.config.js';

const allowedOrigins = [
    'http://localhost:3000',  // Frontend en desarrollo
    env.FRONTEND_URL,         // Frontend configurado en .env
    'https://rachell-nails.vercel.app', // Frontend en producción (antiguo)
    'https://web-kriss-nails.vercel.app' // Frontend en producción (actual)
];

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (como las peticiones desde Postman)
        if (!origin) return callback(null, true);
        
        // Verificar si el origin está en la lista de permitidos
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Origin bloqueado por CORS: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Credentials',
        'Set-Cookie',
        'Cookie'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    maxAge: 86400, // 24 horas
    preflightContinue: false,
    optionsSuccessStatus: 204
};

export default corsOptions; 