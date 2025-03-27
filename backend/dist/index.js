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
    console.log('📚 Documentación API: http://localhost:3001/api-docs');
    console.log('🏥 Health Check: http://localhost:3001/health');
    console.log('🧹 Servicio de limpieza inicializado');
    console.log('=========================\n');
});
