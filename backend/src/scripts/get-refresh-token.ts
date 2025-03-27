import { google } from 'googleapis';
import * as http from 'http';
import { URL } from 'url';
import open from 'open';
import * as dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

// Solicitamos solo los permisos necesarios
const scopes = [
  'https://www.googleapis.com/auth/drive.file'  // Solo para archivos creados por la app
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'  // Forzar el diálogo de consentimiento
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');

    if (code) {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('\nRefresh Token:', tokens.refresh_token);
      console.log('\nGuarda este refresh token en tu archivo .env como GOOGLE_DRIVE_REFRESH_TOKEN\n');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('¡Autorización completada! Puedes cerrar esta ventana.');
      server.close();
    }
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('Error durante la autorización');
    server.close();
  }
});

server.listen(3001, () => {
  console.log('Abriendo el navegador para autorización...');
  open(authUrl);
}); 