import { CorsOptions } from 'cors';
import { env } from './env.config.js';

const allowedOrigins = [
    'http://localhost:3000',  // Frontend en desarrollo
    env.FRONTEND_URL,         // Frontend configurado en .env
    'https://rachell-nails.vercel.app', // Frontend en producción (antiguo)
    'https://web-kriss-nails.vercel.app', // Frontend en producción (actual)
    'https://web-kriss-nails.vercel.app/', // Con slash final
    'https://web-kriss-nails.vercel.app/*' // Con wildcard
];

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origin (como las peticiones desde Postman)
        if (!origin) {
            console.log('✅ Petición sin origin permitida');
            return callback(null, true);
        }
        
        console.log(`🔍 Verificando origin: ${origin}`);
        console.log(`📋 Origins permitidos:`, allowedOrigins);
        
        // Verificar si el origin está en la lista de permitidos
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ Origin permitido: ${origin}`);
            callback(null, true);
        } else {
            console.warn(`❌ Origin bloqueado por CORS: ${origin}`);
            console.warn(`📋 Origins permitidos:`, allowedOrigins);
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