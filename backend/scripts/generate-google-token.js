
import { google } from 'googleapis';
import readline from 'readline';

// Lee credenciales desde variables de entorno para evitar secretos en el repo
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Faltan variables de entorno: GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET');
  console.error('Configura las variables y vuelve a ejecutar el script.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('🔗 URL de autorización:', authUrl);
console.log('\n📋 Pasos a seguir:');
console.log('1. Abre la URL de arriba en tu navegador');
console.log('2. Inicia sesión con tu cuenta de Google autorizada');
console.log('3. Autoriza la aplicación para acceder a Google Drive');
console.log('4. Copia el código de autorización que aparece en la URL');
console.log('5. Pégalo aquí abajo\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Código de autorización: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ Tokens generados exitosamente:');
    console.log('\n🔑 REFRESH TOKEN (guárdalo en Railway):');
    console.log(tokens.refresh_token);
    console.log('\n🔑 ACCESS TOKEN (temporal):');
    console.log(tokens.access_token);
    console.log('\n📋 Variables de entorno para Railway:');
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (error) {
    console.error('❌ Error al obtener tokens:', error.message);
  }

  rl.close();
});
