import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { ImageOptimizerService } from './image-optimizer.service.js';
import NodeCache from 'node-cache';
dotenv.config();
export class GoogleDriveService {
    constructor() {
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 segundo
        this.CACHE_TTL = 24 * 60 * 60; // 24 horas
        this.imageOptimizer = new ImageOptimizerService();
        this.urlCache = new NodeCache({
            stdTTL: this.CACHE_TTL,
            checkperiod: 600, // Revisar caché cada 10 minutos
            useClones: false
        });
        // Configurar el cliente OAuth2
        this.oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_DRIVE_CLIENT_ID, process.env.GOOGLE_DRIVE_CLIENT_SECRET, process.env.GOOGLE_DRIVE_REDIRECT_URI);
        // Configurar el token de actualización
        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
        });
        // Crear el cliente de Drive
        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        });
    }
    /**
     * Ejecuta una operación con reintentos automáticos
     */
    async retryOperation(operation, customRetries) {
        const retries = customRetries || this.MAX_RETRIES;
        let lastError = null;
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (i === retries - 1)
                    break;
                // Esperar antes de reintentar (con backoff exponencial)
                await new Promise(r => setTimeout(r, this.RETRY_DELAY * Math.pow(2, i)));
            }
        }
        throw lastError || new Error('Operation failed after retries');
    }
    /**
     * Verifica si un archivo existe y es accesible
     */
    async verifyFile(fileId) {
        try {
            await this.drive.files.get({
                fileId,
                fields: 'id, name'
            });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Obtiene la URL pública de un archivo con caché
     */
    async getPublicUrl(fileId) {
        // Verificar caché primero
        const cachedUrl = this.urlCache.get(fileId);
        if (cachedUrl)
            return cachedUrl;
        try {
            // Verificar y actualizar permisos
            await this.drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
            // Obtener URL pública
            const file = await this.drive.files.get({
                fileId,
                fields: 'webContentLink'
            });
            const url = file.data.webContentLink || '';
            if (url) {
                this.urlCache.set(fileId, url);
            }
            return url;
        }
        catch (error) {
            console.error('Error al obtener URL pública:', error);
            throw new Error('No se pudo obtener la URL pública');
        }
    }
    getFolderId(type) {
        switch (type) {
            case 'GALLERY':
                return process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || '';
            case 'SERVICE':
                return process.env.GOOGLE_DRIVE_SERVICES_FOLDER_ID || '';
            case 'BEFORE_AFTER':
                return process.env.GOOGLE_DRIVE_BEFORE_AFTER_FOLDER_ID || '';
            default:
                return process.env.GOOGLE_DRIVE_DEFAULT_FOLDER_ID || '';
        }
    }
    /**
     * Sube un archivo a Google Drive con optimización y reintentos automáticos
     */
    async uploadFileToDrive(file, type) {
        return this.retryOperation(async () => {
            const folderId = this.getFolderId(type);
            if (!folderId) {
                throw new Error(`Folder ID no configurado para el tipo: ${type}`);
            }
            try {
                // Validar la imagen
                await this.imageOptimizer.validateImage(file.buffer);
                // Optimizar la imagen
                const optimizedBuffer = await this.imageOptimizer.optimizeImage(file.buffer, {
                    maxWidth: type === 'BEFORE_AFTER' ? 800 : 1920,
                    maxHeight: type === 'BEFORE_AFTER' ? 800 : 1080,
                    quality: type === 'BEFORE_AFTER' ? 85 : 80,
                    format: 'webp'
                });
                // Crear el archivo
                const response = await this.drive.files.create({
                    requestBody: {
                        name: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}.webp`,
                        mimeType: 'image/webp',
                        parents: [folderId],
                    },
                    media: {
                        mimeType: 'image/webp',
                        body: this.imageOptimizer.bufferToStream(optimizedBuffer),
                    },
                });
                if (!response.data.id) {
                    throw new Error('No se pudo obtener el ID del archivo');
                }
                // Obtener URL pública
                return this.getPublicUrl(response.data.id);
            }
            catch (error) {
                console.error('Error al procesar y subir la imagen:', error);
                throw error;
            }
        });
    }
    /**
     * Elimina un archivo de forma segura
     */
    async deleteFile(fileId) {
        await this.retryOperation(async () => {
            try {
                await this.drive.files.delete({ fileId });
                this.urlCache.del(fileId); // Limpiar caché
            }
            catch (error) {
                console.error('Error al eliminar archivo:', error);
                throw error;
            }
        });
    }
    /**
     * Obtiene el ID del archivo desde una URL
     */
    getFileIdFromUrl(url) {
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : '';
    }
    /**
     * Lista archivos en una carpeta específica
     */
    async listFiles(type, pageSize = 10) {
        const folderId = this.getFolderId(type);
        return this.retryOperation(async () => {
            const response = await this.drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                pageSize,
                fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
                orderBy: 'createdTime desc'
            });
            return response.data.files;
        });
    }
}
