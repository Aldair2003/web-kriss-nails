import { google } from 'googleapis';
import env from './env.config.js';
// Configuración del cliente OAuth2
const oauth2Client = new google.auth.OAuth2(env.GOOGLE_DRIVE_CLIENT_ID, env.GOOGLE_DRIVE_CLIENT_SECRET, env.GOOGLE_DRIVE_REDIRECT_URI);
// Configurar el token de actualización
oauth2Client.setCredentials({
    refresh_token: env.GOOGLE_DRIVE_REFRESH_TOKEN
});
// Crear cliente de Drive
const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});
// IDs de carpetas en Google Drive (deberás crear estas carpetas y poner sus IDs)
export const FOLDER_IDS = {
    GALLERY: 'ID_CARPETA_GALERIA',
    SERVICES: 'ID_CARPETA_SERVICIOS',
    BEFORE_AFTER: 'ID_CARPETA_ANTES_DESPUES'
};
export default drive;
