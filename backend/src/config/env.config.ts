import { config } from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
config();

const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string(),

  // JWT
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),

  // Servidor
  PORT: z.string().or(z.number()).default(3001),
  NODE_ENV: z.string().default('development'),

  // CORS y Frontend
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Google Drive (opcional por ahora)
  GOOGLE_DRIVE_CLIENT_ID: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_DRIVE_REDIRECT_URI: z.string().optional(),
  GOOGLE_DRIVE_REFRESH_TOKEN: z.string().optional(),

  // WhatsApp (opcional por ahora)
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),

  // Email
  EMAIL_USER: z.string(),
  EMAIL_PASSWORD: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

// Solo validar las variables requeridas para el email por ahora
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES_IN',
  'EMAIL_USER',
  'EMAIL_PASSWORD'
] as const;

for (const envVar of requiredEnvVars) {
  if (!env[envVar as keyof typeof env]) {
    throw new Error(`La variable de entorno ${envVar} es requerida`);
  }
}

export { env as config };
export default env; 