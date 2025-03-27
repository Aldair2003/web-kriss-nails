import { env } from './env.config.js';
const allowedOrigins = [
    'http://localhost:3000', // Frontend en desarrollo
    env.FRONTEND_URL, // Frontend configurado en .env
    'https://rachell-nails.vercel.app' // Frontend en producción (ajustar según corresponda)
];
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (como las peticiones desde Postman)
        if (!origin)
            return callback(null, true);
        // Verificar si el origin está en la lista de permitidos
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Set-Cookie',
        'Cookie'
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 horas
    preflightContinue: false,
    optionsSuccessStatus: 204
};
export default corsOptions;
