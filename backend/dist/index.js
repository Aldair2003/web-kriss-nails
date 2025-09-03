import app from './app.js';
import dotenv from 'dotenv';
import { cleanupService } from './services/cleanup.service.js';
// Cargar variables de entorno
dotenv.config();
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    // Inicializar el servicio de limpieza
    cleanupService.initializeCleanupJobs();
    console.log('\n=== Rachell Nails API ===');
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://web-kriss-nails-production.up.railway.app'
        : 'http://localhost:3001';
    console.log('📚 Documentación API: ' + baseUrl + '/api-docs');
    console.log('🏥 Health Check: ' + baseUrl + '/health');
    console.log('🧹 Servicio de limpieza inicializado');
    console.log('=========================\n');
});
