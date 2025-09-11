import { integrationTokenService } from './integration-token.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';
import { google } from 'googleapis';
export class TokenMonitorService {
    constructor() {
        this.monitoringInterval = null;
        this.CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas
        this.startMonitoring();
    }
    /**
     * Inicia el monitoreo de tokens
     */
    startMonitoring() {
        logger.info('Iniciando monitoreo de tokens de integración');
        // Ejecutar verificación inmediata
        this.checkAllTokens();
        // Programar verificaciones periódicas
        this.monitoringInterval = setInterval(() => {
            this.checkAllTokens();
        }, this.CHECK_INTERVAL);
    }
    /**
     * Verifica todos los tokens de integración
     */
    async checkAllTokens() {
        try {
            logger.info('Iniciando verificación de tokens de integración');
            // Verificar Google Drive
            await this.checkGoogleDriveToken();
            // Aquí puedes agregar más verificaciones para otros servicios
            // await this.checkGmailToken();
            logger.info('Verificación de tokens completada');
        }
        catch (error) {
            logger.error('Error en verificación de tokens:', error);
        }
    }
    /**
     * Verifica específicamente el token de Google Drive
     */
    async checkGoogleDriveToken() {
        try {
            const tokenData = await integrationTokenService.getToken('google_drive');
            if (!tokenData) {
                logger.warn('No se encontró token de Google Drive en BD');
                await integrationTokenService.markTokenNeedsAuth('google_drive');
                return;
            }
            if (tokenData.needsAuth) {
                logger.info('Token de Google Drive ya marcado como necesita reautorización');
                return;
            }
            // Crear cliente OAuth2 para verificar el token
            const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_DRIVE_CLIENT_ID, process.env.GOOGLE_DRIVE_CLIENT_SECRET, process.env.GOOGLE_DRIVE_REDIRECT_URI);
            oauth2Client.setCredentials({
                refresh_token: tokenData.refreshToken,
                access_token: tokenData.accessToken,
                expiry_date: tokenData.expiresAt?.getTime()
            });
            // Crear cliente de Drive para verificar
            const drive = google.drive({
                version: 'v3',
                auth: oauth2Client
            });
            // Hacer una operación simple para verificar el token
            await drive.files.list({
                pageSize: 1,
                fields: 'files(id, name)'
            });
            // Si llegamos aquí, el token es válido
            await integrationTokenService.updateTokenCheck('google_drive', true);
            logger.info('Token de Google Drive verificado exitosamente');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            logger.error('Error verificando token de Google Drive:', errorMessage);
            // Si es invalid_grant, marcar como necesita reautorización
            if (errorMessage.includes('invalid_grant')) {
                logger.warn('Token de Google Drive expirado detectado en monitoreo');
                await integrationTokenService.markTokenNeedsAuth('google_drive');
                // Enviar notificación por email
                try {
                    await emailService.sendTokenRenewalNotification(process.env.EMAIL_USER || '', 'google_drive', 'error', 'El token de Google Drive ha expirado y necesita reautorización manual');
                }
                catch (emailError) {
                    logger.warn('Error enviando notificación de token expirado:', emailError);
                }
            }
            else {
                // Otros errores pueden ser temporales, solo logear
                logger.warn('Error temporal verificando token de Google Drive:', errorMessage);
            }
        }
    }
    /**
     * Verifica específicamente el token de Gmail (para futuras implementaciones)
     */
    async checkGmailToken() {
        try {
            const tokenData = await integrationTokenService.getToken('gmail');
            if (!tokenData) {
                logger.warn('No se encontró token de Gmail en BD');
                return;
            }
            if (tokenData.needsAuth) {
                logger.info('Token de Gmail ya marcado como necesita reautorización');
                return;
            }
            // Crear cliente OAuth2 para verificar el token
            const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3001/auth/google/callback');
            oauth2Client.setCredentials({
                refresh_token: tokenData.refreshToken,
                access_token: tokenData.accessToken,
                expiry_date: tokenData.expiresAt?.getTime()
            });
            // Crear cliente de Gmail para verificar
            const gmail = google.gmail({
                version: 'v1',
                auth: oauth2Client
            });
            // Hacer una operación simple para verificar el token
            await gmail.users.getProfile({
                userId: 'me'
            });
            // Si llegamos aquí, el token es válido
            await integrationTokenService.updateTokenCheck('gmail', true);
            logger.info('Token de Gmail verificado exitosamente');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            logger.error('Error verificando token de Gmail:', errorMessage);
            // Si es invalid_grant, marcar como necesita reautorización
            if (errorMessage.includes('invalid_grant')) {
                logger.warn('Token de Gmail expirado detectado en monitoreo');
                await integrationTokenService.markTokenNeedsAuth('gmail');
                // Enviar notificación por email
                try {
                    await emailService.sendTokenRenewalNotification(process.env.EMAIL_USER || '', 'gmail', 'error', 'El token de Gmail ha expirado y necesita reautorización manual');
                }
                catch (emailError) {
                    logger.warn('Error enviando notificación de token expirado:', emailError);
                }
            }
            else {
                // Otros errores pueden ser temporales, solo logear
                logger.warn('Error temporal verificando token de Gmail:', errorMessage);
            }
        }
    }
    /**
     * Fuerza una verificación inmediata de todos los tokens
     */
    async forceCheckAllTokens() {
        logger.info('Forzando verificación de todos los tokens');
        await this.checkAllTokens();
    }
    /**
     * Detiene el monitoreo
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            logger.info('Monitoreo de tokens detenido');
        }
    }
    /**
     * Reinicia el monitoreo
     */
    restartMonitoring() {
        this.stopMonitoring();
        this.startMonitoring();
    }
}
// Crear instancia singleton
export const tokenMonitorService = new TokenMonitorService();
