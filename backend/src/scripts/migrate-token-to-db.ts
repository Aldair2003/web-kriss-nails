import { integrationTokenService } from '../services/integration-token.service.js';
import { logger } from '../utils/logger.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateTokenToDatabase() {
  try {
    logger.info('Iniciando migración de token de Google Drive a base de datos');
    
    const envToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    
    if (!envToken) {
      logger.warn('No se encontró GOOGLE_DRIVE_REFRESH_TOKEN en variables de entorno');
      return;
    }
    
    // Verificar si ya existe en BD
    const existingToken = await integrationTokenService.getToken('google_drive');
    
    if (existingToken && !existingToken.needsAuth) {
      logger.info('Token de Google Drive ya existe en base de datos y está activo');
      return;
    }
    
    // Migrar token a BD
    await integrationTokenService.saveToken('google_drive', envToken);
    
    logger.info('✅ Token de Google Drive migrado exitosamente a base de datos');
    logger.info('💡 Ahora puedes eliminar GOOGLE_DRIVE_REFRESH_TOKEN de tu archivo .env');
    
  } catch (error) {
    logger.error('Error migrando token a base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateTokenToDatabase()
  .then(() => {
    logger.info('Migración completada');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error en migración:', error);
    process.exit(1);
  });
