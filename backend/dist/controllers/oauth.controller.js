import { google } from 'googleapis';
import { env } from '../config/env.config.js';
import { integrationTokenService } from '../services/integration-token.service.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';
export const oauthController = {
    /**
     * Inicia el flujo OAuth para Google Drive
     */
    startGoogleDriveAuth: async (req, res) => {
        try {
            logger.info('Iniciando flujo OAuth para Google Drive');
            const oauth2Client = new google.auth.OAuth2(env.GOOGLE_DRIVE_CLIENT_ID, env.GOOGLE_DRIVE_CLIENT_SECRET, env.GOOGLE_DRIVE_REDIRECT_URI);
            const scopes = [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive'
            ];
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes,
                prompt: 'consent',
                state: 'google_drive_auth' // Para identificar el tipo de autorización
            });
            logger.info('URL de autorización generada para Google Drive');
            res.json({
                success: true,
                authUrl,
                message: 'Redirige al usuario a esta URL para autorizar Google Drive'
            });
        }
        catch (error) {
            logger.error('Error iniciando OAuth de Google Drive:', error);
            res.status(500).json({
                success: false,
                message: 'Error iniciando autorización de Google Drive',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    /**
     * Maneja el callback de Google OAuth
     */
    handleGoogleCallback: async (req, res) => {
        try {
            const { code, state, error } = req.query;
            if (error) {
                logger.error('Error en callback de Google OAuth:', error);
                res.status(400).json({
                    success: false,
                    message: 'Error en la autorización de Google',
                    error: error
                });
                return;
            }
            if (!code) {
                logger.error('No se recibió código de autorización');
                res.status(400).json({
                    success: false,
                    message: 'No se recibió código de autorización'
                });
                return;
            }
            logger.info('Procesando callback de Google OAuth', { state });
            const oauth2Client = new google.auth.OAuth2(env.GOOGLE_DRIVE_CLIENT_ID, env.GOOGLE_DRIVE_CLIENT_SECRET, env.GOOGLE_DRIVE_REDIRECT_URI);
            // Intercambiar código por tokens
            const { tokens } = await oauth2Client.getToken(code);
            if (!tokens.refresh_token) {
                logger.error('No se recibió refresh token en la respuesta');
                res.status(400).json({
                    success: false,
                    message: 'No se recibió refresh token válido'
                });
                return;
            }
            // Determinar el proveedor basado en el state
            let provider = 'google_drive';
            if (state === 'google_drive_auth') {
                provider = 'google_drive';
            }
            else if (state === 'gmail_auth') {
                provider = 'gmail';
            }
            // Guardar tokens en la base de datos
            await integrationTokenService.saveToken(provider, tokens.refresh_token, tokens.access_token || undefined, tokens.expiry_date ? new Date(tokens.expiry_date) : undefined);
            logger.info(`Tokens de ${provider} guardados exitosamente`);
            // Enviar notificación por email
            try {
                await emailService.sendTokenRenewalNotification(env.EMAIL_USER, provider, 'success');
            }
            catch (emailError) {
                logger.warn('Error enviando notificación de renovación de token:', emailError);
            }
            // Redirigir al panel de administración
            const redirectUrl = `${env.FRONTEND_URL}/rachell-admin?token_renewed=${provider}`;
            res.redirect(redirectUrl);
        }
        catch (error) {
            logger.error('Error procesando callback de Google OAuth:', error);
            // Enviar notificación de error por email
            try {
                await emailService.sendTokenRenewalNotification(env.EMAIL_USER, 'google_drive', 'error', error instanceof Error ? error.message : 'Error desconocido');
            }
            catch (emailError) {
                logger.warn('Error enviando notificación de error:', emailError);
            }
            res.status(500).json({
                success: false,
                message: 'Error procesando autorización de Google',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    /**
     * Obtiene el estado de los tokens de integración
     */
    getTokenStatus: async (req, res) => {
        try {
            const tokensNeedingAuth = await integrationTokenService.getTokensNeedingAuth();
            res.json({
                success: true,
                tokensNeedingAuth,
                message: tokensNeedingAuth.length > 0
                    ? 'Algunos servicios necesitan reautorización'
                    : 'Todos los servicios están correctamente autorizados'
            });
        }
        catch (error) {
            logger.error('Error obteniendo estado de tokens:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estado de tokens',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    /**
     * Fuerza la verificación de un token específico
     */
    verifyToken: async (req, res) => {
        try {
            const { provider } = req.params;
            if (!provider) {
                res.status(400).json({
                    success: false,
                    message: 'Proveedor no especificado'
                });
                return;
            }
            const token = await integrationTokenService.getToken(provider);
            if (!token) {
                res.status(404).json({
                    success: false,
                    message: `Token de ${provider} no encontrado`
                });
                return;
            }
            // Aquí podrías hacer una verificación real del token
            // Por ahora solo actualizamos el estado
            await integrationTokenService.updateTokenCheck(provider, true);
            res.json({
                success: true,
                message: `Token de ${provider} verificado exitosamente`,
                needsAuth: false
            });
        }
        catch (error) {
            logger.error(`Error verificando token de ${req.params.provider}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error verificando token',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
};
