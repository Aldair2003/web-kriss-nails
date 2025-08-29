import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import * as dotenv from 'dotenv';
import { ImageType } from '@prisma/client';
import { ImageOptimizerService } from './image-optimizer.service.js';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import type { OAuth2Client, Credentials } from 'google-auth-library';

dotenv.config();

interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
}

export class GoogleDriveService {
  private drive!: drive_v3.Drive;
  private oauth2Client!: OAuth2Client;
  private imageOptimizer: ImageOptimizerService;
  private urlCache: NodeCache;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 segundo
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 horas
  private prisma: PrismaClient;
  private tokenRefreshInterval!: NodeJS.Timeout;

  constructor() {
    this.prisma = new PrismaClient();
    logger.info('Inicializando servicio de Google Drive');
    this.imageOptimizer = new ImageOptimizerService();
    this.urlCache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 600, // Revisar caché cada 10 minutos
      useClones: false
    });
    
    this.initializeGoogleDrive();
    this.setupTokenRefresh();
  }

  private initializeGoogleDrive() {
    try {
      logger.info('Configurando cliente OAuth2 de Google Drive');
      
      // Configurar el cliente OAuth2
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        process.env.GOOGLE_DRIVE_REDIRECT_URI
      );

      // Configurar el token de actualización
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      });

      // Configurar evento para token actualizado
      this.oauth2Client.on('tokens', (tokens: Credentials) => {
        logger.info('Token de acceso actualizado automáticamente', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiryDate: tokens.expiry_date
        });
      });

      // Crear el cliente de Drive
      this.drive = google.drive({
        version: 'v3',
        auth: this.oauth2Client
      });

      logger.info('Cliente de Google Drive configurado exitosamente');
    } catch (error) {
      logger.error('Error al inicializar Google Drive:', error);
      throw error;
    }
  }

  private setupTokenRefresh() {
    // Verificar tokens cada 30 minutos
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        logger.info('Verificando estado de tokens de Google Drive');
        const isTokenValid = await this.verifyTokens();
        
        if (!isTokenValid) {
          logger.warn('Tokens de Google Drive inválidos o expirados, intentando renovar');
          await this.refreshTokens();
        } else {
          logger.info('Tokens de Google Drive válidos');
        }
      } catch (error) {
        logger.error('Error al verificar/renovar tokens:', error);
      }
    }, 30 * 60 * 1000); // 30 minutos
  }

  private async verifyTokens(): Promise<boolean> {
    try {
      // Intentar una operación simple para verificar los tokens
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al verificar tokens:', errorMessage);
      return false;
    }
  }

  private async refreshTokens() {
    try {
      logger.info('Iniciando renovación de tokens');
      await this.oauth2Client.refreshAccessToken();
      logger.info('Tokens renovados exitosamente');
    } catch (error) {
      logger.error('Error al renovar tokens:', error);
      // Aquí podrías implementar una notificación por email o webhook
      throw error;
    }
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   */
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Intento ${attempt} de operación en Google Drive`);
        const result = await operation();
        logger.info('Operación completada exitosamente');
        return result;
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        logger.error(`Error en intento ${attempt}: ${errorMessage}`, {
          error,
          attempt,
          maxRetries
        });
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Esperando ${delay}ms antes del siguiente intento`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('Error desconocido en la operación de Google Drive');
  }

  /**
   * Verifica si un archivo existe y es accesible
   */
  async verifyFile(fileId: string): Promise<boolean> {
    try {
      await this.drive.files.get({
        fileId,
        fields: 'id, name'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la URL pública de un archivo con caché
   */
  async getPublicUrl(fileId: string): Promise<string> {
    // Verificar caché primero
    const cachedUrl = this.urlCache.get<string>(fileId);
    if (cachedUrl) return cachedUrl;

    try {
      // Verificar y actualizar permisos
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Usar formato de thumbnails que tiene menos restricciones de permisos
      const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      
      // Almacenar en caché
      this.urlCache.set(fileId, publicUrl);
      return publicUrl;
    } catch (error) {
      logger.error('Error al obtener URL pública:', error);
      throw new Error('No se pudo obtener la URL pública');
    }
  }

  private getFolderId(type: ImageType): string {
    switch (type) {
      case ImageType.GALLERY:
        return process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || '';
      case ImageType.SERVICE:
        return process.env.GOOGLE_DRIVE_SERVICES_FOLDER_ID || '';
      case ImageType.BEFORE_AFTER:
        return process.env.GOOGLE_DRIVE_BEFORE_AFTER_FOLDER_ID || '';
      case ImageType.TEMP:
        return process.env.GOOGLE_DRIVE_DEFAULT_FOLDER_ID || '';
      default:
        return process.env.GOOGLE_DRIVE_DEFAULT_FOLDER_ID || '';
    }
  }

  /**
   * Verifica si la carpeta existe o crea una nueva
   */
  private async verifyOrCreateFolder(folderName: string): Promise<string> {
    try {
      // Intentar crear la carpeta
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id'
      });

      if (response.data.id) {
        console.log(`Carpeta "${folderName}" creada con ID: ${response.data.id}`);
        
        // Hacer la carpeta pública
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
        
        return response.data.id;
      }
      
      throw new Error(`No se pudo crear la carpeta "${folderName}"`);
    } catch (error) {
      console.error(`Error al crear carpeta "${folderName}":`, error);
      return ''; // Retornar vacío para usar la raíz
    }
  }

  /**
   * Obtiene o crea un ID de carpeta según el tipo de imagen
   */
  private async getFolderIdOrCreate(type: ImageType): Promise<string> {
    const configuredFolderId = this.getFolderId(type);
    
    // Si hay un ID configurado, verificar si existe
    if (configuredFolderId) {
      try {
        await this.drive.files.get({
          fileId: configuredFolderId,
          fields: 'id, name'
        });
        return configuredFolderId;
      } catch (error) {
        logger.warn(`La carpeta configurada para ${type} no existe:`, error);
      }
    }
    
    // Crear una nueva carpeta según el tipo
    const folderName = `Rachell-${type.toLowerCase()}-${Date.now()}`;
    return this.createFolder(folderName);
  }

  /**
   * Genera un nombre de archivo descriptivo basado en el tipo y contexto
   */
  private generateFileName(
    file: Express.Multer.File,
    type: ImageType,
    context?: { serviceName?: string }
  ): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = Date.now();
    const sanitizeName = (name: string) => name.toLowerCase()
      .replace(/[áéíóúñ]/g, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' })[c] || c)
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    logger.info('Generando nombre de archivo:', {
      originalName: file.originalname,
      type,
      serviceName: context?.serviceName
    });

    let fileName: string;
    switch (type) {
      case ImageType.SERVICE:
        if (!context?.serviceName) {
          logger.warn('No se proporcionó nombre de servicio para una imagen de servicio');
        }
        const serviceName = context?.serviceName ? sanitizeName(context.serviceName) : 'servicio';
        fileName = `${serviceName}-${date}-${timestamp}.webp`;
        break;
      
      case ImageType.GALLERY:
        fileName = `galeria-${date}-${timestamp}.webp`;
        break;
      
      case ImageType.TEMP:
        fileName = `temp-${date}-${timestamp}.webp`;
        break;
      
      default:
        const baseName = file.originalname.replace(/\.[^/.]+$/, '');
        fileName = `${sanitizeName(baseName)}-${date}-${timestamp}.webp`;
    }

    logger.info('Nombre de archivo generado:', { fileName });
    return fileName;
  }

  /**
   * Crea una carpeta en Google Drive si no existe
   */
  private async createFolder(folderName: string, parentId?: string): Promise<string> {
    try {
      const requestBody: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        requestBody.parents = [parentId];
      }

      const response = await this.drive.files.create({
        requestBody,
        fields: 'id'
      });

      if (response.data.id) {
        logger.info(`Carpeta "${folderName}" creada con ID: ${response.data.id}`);
        
        // Hacer la carpeta pública
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
        
        return response.data.id;
      }
      
      throw new Error(`No se pudo crear la carpeta "${folderName}"`);
    } catch (error) {
      logger.error(`Error al crear carpeta "${folderName}":`, error);
      throw error;
    }
  }

  /**
   * Busca una carpeta por nombre dentro de un padre específico
   */
  private async findFolderByName(name: string, parentId?: string): Promise<string | null> {
    try {
      const query = parentId 
        ? `name = '${name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder'`
        : `name = '${name}' and mimeType = 'application/vnd.google-apps.folder'`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id || null;
      }

      return null;
    } catch (error) {
      logger.error(`Error al buscar carpeta "${name}":`, error);
      return null;
    }
  }

  /**
   * Obtiene o crea una carpeta para un servicio específico
   */
  private async getServiceFolder(serviceName: string): Promise<string> {
    try {
      // 1. Obtener/Crear carpeta principal de servicios
      const mainFolderId = process.env.GOOGLE_DRIVE_SERVICES_FOLDER_ID;
      let servicesFolderId: string;
      
      if (!mainFolderId) {
        // Buscar la carpeta Rachell-Services
        const foundFolderId = await this.findFolderByName('Rachell-Services');
        if (!foundFolderId) {
          // Crear la carpeta si no existe
          servicesFolderId = await this.createFolder('Rachell-Services');
        } else {
          servicesFolderId = foundFolderId;
        }
      } else {
        servicesFolderId = mainFolderId;
      }

      // 2. Crear nombre de carpeta para el servicio
      const date = new Date().toISOString().split('T')[0];
      const sanitizedServiceName = serviceName.toLowerCase()
        .replace(/[áéíóúñ]/g, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' })[c] || c)
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const serviceFolderName = `${sanitizedServiceName}-${date}`;

      // 3. Buscar/Crear carpeta del servicio
      const existingFolderId = await this.findFolderByName(serviceFolderName, servicesFolderId);
      const serviceFolderId = existingFolderId || await this.createFolder(serviceFolderName, servicesFolderId);

      return serviceFolderId;
    } catch (error) {
      logger.error('Error al obtener/crear carpeta de servicio:', error);
      throw error;
    }
  }

  /**
   * Sube un archivo a Google Drive con optimización y reintentos automáticos
   */
  async uploadFileToDrive(
    file: Express.Multer.File,
    type: ImageType,
    context?: { serviceName?: string }
  ): Promise<string> {
    logger.info(`Iniciando subida de archivo:`, {
      originalName: file.originalname,
      type,
      serviceName: context?.serviceName,
      size: file.size
    });
    
    return this.retryOperation(async () => {
      try {
        let folderId: string;
        
        if (type === ImageType.SERVICE && context?.serviceName) {
          // Para servicios, usar la estructura jerárquica
          folderId = await this.getServiceFolder(context.serviceName);
          logger.info('Usando carpeta de servicio:', { folderId, serviceName: context.serviceName });
        } else {
          // Para otros tipos, usar la estructura plana existente
          folderId = await this.getFolderIdOrCreate(type);
        }

        // Validar la imagen
        await this.imageOptimizer.validateImage(file.buffer);

        // Optimizar la imagen
        const optimizedBuffer = await this.imageOptimizer.optimizeImage(file.buffer, {
          maxWidth: type === ImageType.BEFORE_AFTER ? 800 : 1920,
          maxHeight: type === ImageType.BEFORE_AFTER ? 800 : 1080,
          quality: type === ImageType.BEFORE_AFTER ? 85 : 80,
          format: 'webp'
        });

        // Generar nombre descriptivo
        const fileName = this.generateFileName(file, type, context);

        // Crear el archivo
        const requestBody: any = {
          name: fileName,
          mimeType: 'image/webp',
          parents: [folderId]
        };

        const response = await this.drive.files.create({
          requestBody,
          media: {
            mimeType: 'image/webp',
            body: this.imageOptimizer.bufferToStream(optimizedBuffer),
          },
        });

        if (!response.data.id) {
          throw new Error('No se pudo obtener el ID del archivo');
        }

        logger.info('Archivo creado exitosamente:', {
          fileName,
          fileId: response.data.id,
          folderId
        });

        // Obtener URL pública
        return this.getPublicUrl(response.data.id);
      } catch (error) {
        logger.error('Error al procesar y subir la imagen:', error);
        throw error;
      }
    });
  }

  /**
   * Elimina un archivo de forma segura
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.retryOperation(async () => {
      try {
        await this.drive.files.delete({ fileId });
        this.urlCache.del(fileId); // Limpiar caché
      } catch (error) {
        console.error('Error al eliminar archivo:', error);
        throw error;
      }
    });
  }

  /**
   * Obtiene el ID del archivo desde una URL
   */
  getFileIdFromUrl(url: string): string {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : '';
  }

  /**
   * Lista archivos en una carpeta específica
   */
  async listFiles(type: ImageType, pageSize = 10): Promise<DriveFileInfo[]> {
    const folderId = this.getFolderId(type);
    
    return this.retryOperation(async () => {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        pageSize,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
        orderBy: 'createdTime desc'
      });

      return response.data.files as DriveFileInfo[];
    });
  }

  /**
   * Genera una miniatura de una imagen ya subida y la sube a Drive
   */
  async createThumbnail(originalUrl: string): Promise<string> {
    try {
      logger.info('Generando miniatura para imagen', { originalUrl });
      
      // Obtener ID del archivo original
      const fileId = this.getFileIdFromUrl(originalUrl);
      
      // Verificar que el archivo original existe
      const exists = await this.verifyFile(fileId);
      if (!exists) {
        throw new Error('El archivo original no existe');
      }
      
      // Descargar el archivo original
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'stream' });
      
      // Convertir stream a buffer
      const chunks: any[] = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // Optimizar la imagen para generar la miniatura
      const thumbBuffer = await this.imageOptimizer.optimizeImage(buffer, {
        maxWidth: 300,
        maxHeight: 300,
        format: 'webp',
        quality: 75
      });
      
      // Obtener metadatos del archivo original
      const fileMetadata = await this.drive.files.get({
        fileId,
        fields: 'name,parents'
      });
      
      // Crear nombre para la miniatura
      const originalName = fileMetadata.data.name || '';
      const thumbnailName = originalName.replace(/\.[^/.]+$/, '') + '-thumbnail.webp';
      
      // Subir la miniatura al mismo directorio que el original
      const parentFolderId = fileMetadata.data.parents?.[0] || '';
      
      const fileMetadataThumb = {
        name: thumbnailName,
        ...(parentFolderId && { parents: [parentFolderId] })
      };
      
      const media = {
        mimeType: 'image/webp',
        body: Readable.from(thumbBuffer)
      };
      
      // Subir la miniatura
      const uploadResponse = await this.drive.files.create({
        requestBody: fileMetadataThumb,
        media: media,
        fields: 'id'
      });
      
      const thumbId = uploadResponse.data.id || '';
      
      if (thumbId) {
        // Hacer la miniatura pública
        await this.drive.permissions.create({
          fileId: thumbId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
        
        // Obtener URL pública de la miniatura
        const thumbnailUrl = await this.getPublicUrl(thumbId);
        
        logger.info('Miniatura generada correctamente', { thumbnailUrl });
        return thumbnailUrl;
      } else {
        logger.warn('No se pudo obtener ID de la miniatura');
        return '';
      }
    } catch (error) {
      logger.error('Error al crear miniatura', error);
      return ''; // Retornar vacío para usar la URL original
    }
  }

  // Asegurarse de limpiar el intervalo cuando se destruye la instancia
  public destroy() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  }
} 