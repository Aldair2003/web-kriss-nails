import { emailService } from '../services/email.service.js';

async function testEmails() {
  try {
    console.log('🚀 Probando envío de emails...\n');
    
    // Datos de prueba
    const testData = {
      clientName: 'Gabriel Barre',
      serviceName: 'Manicure Deluxe',
      date: new Date('2024-03-30T14:00:00'),
      time: '14:00'
    };

    // 1. Probar email de confirmación
    console.log('📧 Enviando email de confirmación...');
    await emailService.sendAppointmentConfirmation(
      'barregabriel03@gmail.com',
      testData
    );
    console.log('✅ Email de confirmación enviado\n');

    // 2. Probar email de recordatorio
    console.log('📧 Enviando email de recordatorio...');
    await emailService.sendAppointmentReminder(
      'barregabriel03@gmail.com',
      testData
    );
    console.log('✅ Email de recordatorio enviado\n');

    // 3. Probar email de cancelación
    console.log('📧 Enviando email de cancelación...');
    await emailService.sendAppointmentCancellation(
      'barregabriel03@gmail.com',
      testData
    );
    console.log('✅ Email de cancelación enviado\n');

    console.log('✨ Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.error('❌ Error al enviar emails:', error);
  }
}

testEmails(); 