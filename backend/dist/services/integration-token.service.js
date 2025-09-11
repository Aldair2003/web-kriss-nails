import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
const prisma = new PrismaClient();
// Clave para cifrar/descifrar tokens (en producción usar variable de entorno)
const ENCRYPTION_KEY_RAW = (process.env.TOKEN_ENCRYPTION_KEY || 'rachell-nails-token-key-2024-secure').padEnd(32, '0').slice(0, 32);
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW, 'utf8');
const ALGORITHM = 'aes-256-gcm';
export class IntegrationTokenService {
    /**
     * Cifra un token usando AES-256-GCM
     */
    encryptToken(token) {
        try {
            const iv = crypto.randomBytes(12); // 96-bit para GCM
            const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
            cipher.setAAD(Buffer.from('integration-token', 'utf8'));
            const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
            const authTag = cipher.getAuthTag();
            // Combinar IV + authTag + encrypted (hex)
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
        }
        catch (error) {
            logger.error('Error cifrando token:', error);
            throw new Error('Error cifrando token');
        }
    }
    /**
     * Descifra un token usando AES-256-GCM
     */
    decryptToken(encryptedToken) {
        try {
            const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
            decipher.setAAD(Buffer.from('integration-token', 'utf8'));
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8');
            return decrypted;
        }
        catch (error) {
            logger.error('Error descifrando token:', error);
            throw new Error('Error descifrando token');
        }
    }
    /**
     * Guarda o actualiza un token de integración
     */
    async saveToken(provider, refreshToken, accessToken, expiresAt) {
        try {
            const encryptedRefreshToken = this.encryptToken(refreshToken);
            const encryptedAccessToken = accessToken ? this.encryptToken(accessToken) : null;
            await prisma.integrationToken.upsert({
                where: { provider },
                update: {
                    refreshToken: encryptedRefreshToken,
                    accessToken: encryptedAccessToken,
                    expiresAt,
                    isActive: true,
                    needsAuth: false,
                    lastChecked: new Date(),
                    updatedAt: new Date()
                },
                create: {
                    provider,
                    refreshToken: encryptedRefreshToken,
                    accessToken: encryptedAccessToken,
                    expiresAt,
                    isActive: true,
                    needsAuth: false,
                    lastChecked: new Date()
                }
            });
            logger.info(`Token de ${provider} guardado exitosamente`);
        }
        catch (error) {
            logger.error(`Error guardando token de ${provider}:`, error);
            throw error;
        }
    }
    /**
     * Obtiene un token de integración
     */
    async getToken(provider) {
        try {
            const token = await prisma.integrationToken.findUnique({
                where: { provider }
            });
            if (!token || !token.isActive) {
                return null;
            }
            return {
                refreshToken: this.decryptToken(token.refreshToken),
                accessToken: token.accessToken ? this.decryptToken(token.accessToken) : undefined,
                expiresAt: token.expiresAt || undefined,
                needsAuth: token.needsAuth
            };
        }
        catch (error) {
            logger.error(`Error obteniendo token de ${provider}:`, error);
            return null;
        }
    }
    /**
     * Marca que un token necesita reautorización
     */
    async markTokenNeedsAuth(provider) {
        try {
            await prisma.integrationToken.update({
                where: { provider },
                data: {
                    needsAuth: true,
                    isActive: false,
                    lastChecked: new Date(),
                    updatedAt: new Date()
                }
            });
            logger.warn(`Token de ${provider} marcado como necesita reautorización`);
        }
        catch (error) {
            logger.error(`Error marcando token de ${provider} como necesita auth:`, error);
            throw error;
        }
    }
    /**
     * Actualiza el estado de verificación de un token
     */
    async updateTokenCheck(provider, isValid) {
        try {
            await prisma.integrationToken.update({
                where: { provider },
                data: {
                    lastChecked: new Date(),
                    needsAuth: !isValid,
                    isActive: isValid,
                    updatedAt: new Date()
                }
            });
            logger.info(`Estado de token de ${provider} actualizado: ${isValid ? 'válido' : 'inválido'}`);
        }
        catch (error) {
            logger.error(`Error actualizando estado de token de ${provider}:`, error);
            throw error;
        }
    }
    /**
     * Obtiene todos los tokens que necesitan reautorización
     */
    async getTokensNeedingAuth() {
        try {
            const tokens = await prisma.integrationToken.findMany({
                where: { needsAuth: true },
                select: { provider: true }
            });
            return tokens.map(t => t.provider);
        }
        catch (error) {
            logger.error('Error obteniendo tokens que necesitan auth:', error);
            return [];
        }
    }
    /**
     * Elimina un token de integración
     */
    async deleteToken(provider) {
        try {
            await prisma.integrationToken.delete({
                where: { provider }
            });
            logger.info(`Token de ${provider} eliminado`);
        }
        catch (error) {
            logger.error(`Error eliminando token de ${provider}:`, error);
            throw error;
        }
    }
}
export const integrationTokenService = new IntegrationTokenService();
