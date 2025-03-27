import { prisma } from '../config/prisma.js';
import { GoogleDriveService } from './drive.service.js';
import { ImageType, SystemLogType } from '@prisma/client';
import cron from 'node-cron';
class CleanupService {
    constructor() {
        this.driveService = new GoogleDriveService();
    }
    static getInstance() {
        if (!CleanupService.instance) {
            CleanupService.instance = new CleanupService();
        }
        return CleanupService.instance;
    }
    /**
     * Inicializa los trabajos de limpieza programados
     */
    initializeCleanupJobs() {
        // Ejecutar limpieza de imágenes huérfanas cada día a las 3 AM
        cron.schedule('0 3 * * *', async () => {
            try {
                await this.cleanupOrphanedImages();
                console.log('[CleanupService] Limpieza de imágenes huérfanas completada');
            }
            catch (error) {
                console.error('[CleanupService] Error durante la limpieza de imágenes:', error);
                await this.logError('Error durante la limpieza de imágenes huérfanas', error);
            }
        });
        // Ejecutar limpieza de imágenes temporales cada 6 horas
        cron.schedule('0 */6 * * *', async () => {
            try {
                await this.cleanupTempImages();
                console.log('[CleanupService] Limpieza de imágenes temporales completada');
            }
            catch (error) {
                console.error('[CleanupService] Error durante la limpieza de imágenes temporales:', error);
                await this.logError('Error durante la limpieza de imágenes temporales', error);
            }
        });
    }
    /**
     * Limpia las imágenes huérfanas de la base de datos y Google Drive
     */
    async cleanupOrphanedImages() {
        try {
            // 1. Obtener todas las imágenes huérfanas
            const images = await prisma.image.findMany({
                where: {
                    OR: [
                        {
                            type: ImageType.SERVICE,
                            service: null
                        },
                        {
                            type: ImageType.BEFORE_AFTER,
                            service: null
                        }
                    ]
                }
            });
            let deletedCount = 0;
            let errorCount = 0;
            // 2. Eliminar cada imagen huérfana
            for (const image of images) {
                try {
                    const fileId = this.driveService.getFileIdFromUrl(image.url);
                    if (fileId) {
                        await this.driveService.deleteFile(fileId);
                    }
                    await prisma.image.delete({
                        where: { id: image.id }
                    });
                    deletedCount++;
                }
                catch (error) {
                    errorCount++;
                    console.error(`[CleanupService] Error al eliminar imagen ${image.id}:`, error);
                }
            }
            // 3. Registrar el resultado de la limpieza
            await prisma.systemLog.create({
                data: {
                    type: SystemLogType.CLEANUP,
                    description: `Limpieza de imágenes huérfanas completada. Eliminadas: ${deletedCount}, Errores: ${errorCount}`
                }
            });
        }
        catch (error) {
            await this.logError('Error general durante la limpieza de imágenes huérfanas', error);
            throw error;
        }
    }
    /**
     * Limpia las imágenes temporales más antiguas que el límite especificado
     */
    async cleanupTempImages(maxAgeHours = 24) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
            const tempImages = await prisma.image.findMany({
                where: {
                    type: ImageType.TEMP,
                    createdAt: {
                        lt: cutoffDate
                    }
                }
            });
            let deletedCount = 0;
            let errorCount = 0;
            for (const image of tempImages) {
                try {
                    const fileId = this.driveService.getFileIdFromUrl(image.url);
                    if (fileId) {
                        await this.driveService.deleteFile(fileId);
                    }
                    await prisma.image.delete({
                        where: { id: image.id }
                    });
                    deletedCount++;
                }
                catch (error) {
                    errorCount++;
                    console.error(`[CleanupService] Error al eliminar imagen temporal ${image.id}:`, error);
                }
            }
            // Registrar el resultado
            await prisma.systemLog.create({
                data: {
                    type: SystemLogType.CLEANUP,
                    description: `Limpieza de imágenes temporales completada. Eliminadas: ${deletedCount}, Errores: ${errorCount}`
                }
            });
        }
        catch (error) {
            await this.logError('Error general durante la limpieza de imágenes temporales', error);
            throw error;
        }
    }
    /**
     * Registra un error en el sistema
     */
    async logError(message, error) {
        try {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await prisma.systemLog.create({
                data: {
                    type: SystemLogType.ERROR,
                    description: `${message}: ${errorMessage}`
                }
            });
        }
        catch (logError) {
            console.error('[CleanupService] Error al registrar error:', logError);
        }
    }
}
export const cleanupService = CleanupService.getInstance();
