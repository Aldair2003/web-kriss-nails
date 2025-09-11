import { google } from 'googleapis';
import { env } from '../config/env.config.js';

const BUSINESS_INFO = {
  name: 'Rachell Benavides',
  businessName: 'Kriss Beauty Nails',
  address: 'Esmeraldas, Ecuador',
  phone: '+593 99 382 6728',
  instagram: '@kriss.beauty.nails',
  instagramUrl: 'https://www.instagram.com/kriss.beauty.nails/',
  tiktok: '@kris.beauty.nails',
  tiktokUrl: 'https://www.tiktok.com/@kris.beauty.nails?_t=ZM-8zKJWTyTJ01&_r=1',
  logo: 'https://i.imgur.com/sClXFFw.jpeg'
};

const emailTemplate = (content: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background-color: #f8bbd0;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .logo {
          width: 150px;
          height: auto;
          border-radius: 75px;
        }
        .content {
          padding: 20px;
          background-color: #fff;
          border: 1px solid #f8bbd0;
        }
        .footer {
          background-color: #f8bbd0;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          font-size: 14px;
        }
        .social-link {
          color: #e91e63;
          text-decoration: none;
        }
        .appointment-details {
          background-color: #fce4ec;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          display: inline-block;
          margin: 20px 0;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        

      </style>
    </head>
    <body>
      <div class="header">
        <img src="${BUSINESS_INFO.logo}" alt="${BUSINESS_INFO.businessName}" class="logo">
        <h1 style="color: #e91e63; margin-top: 10px;">${BUSINESS_INFO.businessName}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p><strong>${BUSINESS_INFO.name}</strong><br>
        📍 ${BUSINESS_INFO.address}<br>
        📱 ${BUSINESS_INFO.phone}<br>
        📸 <a href="${BUSINESS_INFO.instagramUrl}" class="social-link" target="_blank">${BUSINESS_INFO.instagram}</a><br>
        🎵 <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link" target="_blank">${BUSINESS_INFO.tiktok}</a></p>
      </div>
    </body>
  </html>
`;

class EmailService {
  private gmail: any;
  private oauth2Client: any;

  constructor() {
    this.initializeGmailAPI();
  }

  private async initializeGmailAPI() {
    try {
      if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        console.log('🔧 Configurando Gmail API con OAuth2...');
        
        // Configurar OAuth2 client
        this.oauth2Client = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          'http://localhost:3001/auth/google/callback'
        );

        this.oauth2Client.setCredentials({
          refresh_token: env.GOOGLE_REFRESH_TOKEN
        });

        // Crear Gmail API client
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        
        console.log('✅ Gmail API configurado exitosamente');
      } else {
        console.log('⚠️ Variables OAuth2 no configuradas, usando fallback');
        this.gmail = null;
      }
    } catch (error) {
      console.error('❌ Error configurando Gmail API:', error instanceof Error ? error.message : String(error));
      this.gmail = null;
    }
  }

  private async sendEmailWithGmailAPI(to: string, subject: string, htmlContent: string) {
    if (!this.gmail) {
      throw new Error('Gmail API no configurado');
    }

    // Crear mensaje en formato base64 con encoding UTF-8
    const message = [
      `From: "${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(htmlContent).toString('base64')
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    try {
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      console.log('✅ Email enviado exitosamente via Gmail API');
    } catch (error) {
      console.error('❌ Error enviando email via Gmail API:', error);
      throw error;
    }
  }

  async sendAppointmentConfirmation(
    to: string,
    appointmentData: {
      clientName: string;
      serviceName: string;
      date: Date;
      time: string;
    }
  ) {
    const { clientName, serviceName, date, time } = appointmentData;
    
    const content = `
      <h2>¡Cita Confirmada!</h2>
      <p>Hola ${clientName},</p>
      <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
      <div class="appointment-details">
        <p><strong>Servicio:</strong> ${serviceName}</p>
        <p><strong>Fecha:</strong> ${date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Hora:</strong> ${time}</p>
      </div>
      <p><strong>Recomendaciones importantes:</strong></p>
      <ul>
        <li>Por favor, llega 5 minutos antes de tu cita para que podamos comenzar a tiempo</li>
        <li>Ten en cuenta que tenemos una tolerancia de 15 minutos. Después de ese tiempo no podremos atenderte y se considerará como cita cancelada</li>
        <li>Si necesitas cancelar o reprogramar, házlo con al menos 24 horas de anticipación</li>
      </ul>
      
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <p style="font-size: 18px; color: #6b46c1; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ¡Síguenos en nuestras redes sociales!
        </p>
        <p style="color: #666; margin-bottom: 25px; font-size: 14px; text-align: center;">
          Para ver nuestros trabajos más recientes y estar al día con nuestras novedades
        </p>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; width: 100%;">
          <a href="${BUSINESS_INFO.instagramUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/Jf2caEg.png" alt="Instagram" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">Instagram</span>
          </a>
          
          <a href="${BUSINESS_INFO.tiktokUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/o3xzf71.png" alt="TikTok" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">TikTok</span>
          </a>
        </div>
      </div>
    `;

    await this.sendEmailWithGmailAPI(
      to,
      `Confirmación de Cita - ${BUSINESS_INFO.businessName}`,
      emailTemplate(content)
    );
  }

  async sendAppointmentReminder(
    to: string,
    appointmentData: {
      clientName: string;
      serviceName: string;
      date: Date;
      time: string;
    }
  ) {
    const { clientName, serviceName, date, time } = appointmentData;
    
    const content = `
      <h2>Recordatorio de Cita</h2>
      <p>Hola ${clientName},</p>
      <p>Te recordamos que tienes una cita programada para mañana:</p>
      <div class="appointment-details">
        <p><strong>Servicio:</strong> ${serviceName}</p>
        <p><strong>Fecha:</strong> ${date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Hora:</strong> ${time}</p>
      </div>
      <p><strong>Recuerda:</strong></p>
      <ul>
        <li>Llegar 5 minutos antes de tu cita para que podamos comenzar a tiempo</li>
        <li>Ten en cuenta que tenemos una tolerancia de 15 minutos. Después de ese tiempo no podremos atenderte</li>
        <li>Si necesitas cancelar, házlo con anticipación</li>
      </ul>
      <p>¡Te esperamos mañana!</p>
      
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <p style="font-size: 18px; color: #6b46c1; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ¡Síguenos en nuestras redes sociales!
        </p>
        <p style="color: #666; margin-bottom: 25px; font-size: 14px; text-align: center;">
          Para ver nuestros trabajos más recientes y estar al día con nuestras novedades
        </p>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; width: 100%;">
          <a href="${BUSINESS_INFO.instagramUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/Jf2caEg.png" alt="Instagram" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">Instagram</span>
          </a>
          
          <a href="${BUSINESS_INFO.tiktokUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/o3xzf71.png" alt="TikTok" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">TikTok</span>
          </a>
        </div>
      </div>
    `;

    await this.sendEmailWithGmailAPI(
      to,
      `Recordatorio de Cita - ${BUSINESS_INFO.businessName}`,
      emailTemplate(content)
    );
  }

  async sendAppointmentCancellation(
    to: string,
    appointmentData: {
      clientName: string;
      serviceName: string;
      date: Date;
      time: string;
    }
  ) {
    const { clientName, serviceName, date, time } = appointmentData;
    
    const content = `
      <h2>Cita Cancelada</h2>
      <p>Hola ${clientName},</p>
      <p>Tu cita ha sido cancelada. Aquí están los detalles:</p>
      <div class="appointment-details">
        <p><strong>Servicio:</strong> ${serviceName}</p>
        <p><strong>Fecha:</strong> ${date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Hora:</strong> ${time}</p>
      </div>
      <p>Si deseas reagendar tu cita, puedes contactarnos a través de:</p>
      <ul>
        <li>WhatsApp: ${BUSINESS_INFO.phone}</li>
        <li>Instagram: <a href="${BUSINESS_INFO.instagramUrl}" class="social-link">${BUSINESS_INFO.instagram}</a></li>
        <li>TikTok: <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link">${BUSINESS_INFO.tiktok}</a></li>
      </ul>
      <p>¡Esperamos verte pronto!</p>
      
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <p style="font-size: 18px; color: #6b46c1; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ¡Síguenos en nuestras redes sociales!
        </p>
        <p style="color: #666; margin-bottom: 25px; font-size: 14px; text-align: center;">
          Para ver nuestros trabajos más recientes y estar al día con nuestras novedades
        </p>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; width: 100%;">
          <a href="${BUSINESS_INFO.instagramUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/Jf2caEg.png" alt="Instagram" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">Instagram</span>
          </a>
          
          <a href="${BUSINESS_INFO.tiktokUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/o3xzf71.png" alt="TikTok" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">TikTok</span>
          </a>
        </div>
      </div>
    `;

    await this.sendEmailWithGmailAPI(
      to,
      `Cita Cancelada - ${BUSINESS_INFO.businessName}`,
      emailTemplate(content)
    );
  }

  async sendAppointmentCompletion(
    to: string,
    appointmentData: {
      clientName: string;
      serviceName: string;
      date: Date;
      time: string;
    }
  ) {
    const { clientName, serviceName, date, time } = appointmentData;
    
    const content = `
      <h2>¡Servicio Completado!</h2>
      <p>Hola ${clientName},</p>
      <p>¡Gracias por confiar en nosotros! Tu servicio ha sido completado exitosamente.</p>
      <div class="appointment-details">
        <p><strong>Servicio:</strong> ${serviceName}</p>
        <p><strong>Fecha:</strong> ${date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Hora:</strong> ${time}</p>
      </div>
      <p>Esperamos que hayas quedado satisfecha con nuestro trabajo. ¡Nos encantaría verte nuevamente!</p>
      <p>Para tu próxima cita, puedes agendar directamente en nuestro sitio web o contactarnos por:</p>
      <ul>
        <li>WhatsApp: ${BUSINESS_INFO.phone}</li>
        <li>Instagram: <a href="${BUSINESS_INFO.instagramUrl}" class="social-link">${BUSINESS_INFO.instagram}</a></li>
        <li>TikTok: <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link">${BUSINESS_INFO.tiktok}</a></li>
      </ul>
      <p>¡Gracias por elegir ${BUSINESS_INFO.businessName}!</p>
      
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <p style="font-size: 18px; color: #6b46c1; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ¡Síguenos en nuestras redes sociales!
        </p>
        <p style="color: #666; margin-bottom: 25px; font-size: 14px; text-align: center;">
          Para ver nuestros trabajos más recientes y estar al día con nuestras novedades
        </p>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; width: 100%;">
          <a href="${BUSINESS_INFO.instagramUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/Jf2caEg.png" alt="Instagram" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">Instagram</span>
          </a>
          
          <a href="${BUSINESS_INFO.tiktokUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/o3xzf71.png" alt="TikTok" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">TikTok</span>
          </a>
        </div>
      </div>
    `;

    await this.sendEmailWithGmailAPI(
      to,
      `Servicio Completado - ${BUSINESS_INFO.businessName}`,
      emailTemplate(content)
    );
  }

  async sendNewReviewNotification(
    to: string,
    reviewData: {
      id: string;
      clientName: string;
      rating: number;
      comment: string;
      createdAt: Date;
    }
  ) {
    const { id, clientName, rating, comment, createdAt } = reviewData;
    
    const stars = '⭐'.repeat(rating);
    
    const content = `
      <h2>Nueva Reseña Recibida</h2>
      <p>Has recibido una nueva reseña de <strong>${clientName}</strong>.</p>
      <div class="appointment-details">
        <p><strong>Calificación:</strong> ${stars} (${rating}/5)</p>
        <p><strong>Comentario:</strong> "${comment}"</p>
        <p><strong>Fecha:</strong> ${createdAt.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      <p>Esta reseña está pendiente de aprobación. Por favor, revísala en tu panel de administración:</p>
      <a href="${env.FRONTEND_URL}/admin/reviews" class="button" target="_blank">Ver Panel de Reseñas</a>
      <p>Recuerda que las reseñas solo se muestran en tu sitio web después de ser aprobadas.</p>
      
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <p style="font-size: 18px; color: #6b46c1; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ¡Síguenos en nuestras redes sociales!
        </p>
        <p style="color: #666; margin-bottom: 25px; font-size: 14px; text-align: center;">
          Para ver nuestros trabajos más recientes y estar al día con nuestras novedades
        </p>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; width: 100%;">
          <a href="${BUSINESS_INFO.instagramUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/Jf2caEg.png" alt="Instagram" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">Instagram</span>
          </a>
          
          <a href="${BUSINESS_INFO.tiktokUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/o3xzf71.png" alt="TikTok" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">TikTok</span>
          </a>
        </div>
      </div>
    `;

    await this.sendEmailWithGmailAPI(
      to,
      `Nueva Reseña - ${BUSINESS_INFO.businessName}`,
      emailTemplate(content)
    );
  }

  async sendReviewApprovedNotification(
    to: string,
    reviewData: {
      clientName: string;
      rating: number;
      comment: string;
      adminReply?: string;
    }
  ) {
    const { clientName, rating, comment, adminReply } = reviewData;
    
    const stars = '⭐'.repeat(rating);
    
    const content = `
      <h2>Tu Reseña Ha Sido Aprobada</h2>
      <p>Hola ${clientName},</p>
      <p>Queremos agradecerte por tomarte el tiempo de dejar tu opinión sobre nuestros servicios.</p>
      <div class="appointment-details">
        <p><strong>Tu calificación:</strong> ${stars} (${rating}/5)</p>
        <p><strong>Tu comentario:</strong> "${comment}"</p>
        ${adminReply ? `<p><strong>Nuestra respuesta:</strong> "${adminReply}"</p>` : ''}
      </div>
      <p>Tu reseña ya está visible en nuestra página web. ¡Gracias por ayudarnos a mejorar!</p>
      <p>Esperamos verte pronto nuevamente.</p>
      <a href="${env.FRONTEND_URL}" class="button" target="_blank">Visitar Nuestra Web</a>
      
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <p style="font-size: 18px; color: #6b46c1; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ¡Síguenos en nuestras redes sociales!
        </p>
        <p style="color: #666; margin-bottom: 25px; font-size: 14px; text-align: center;">
          Para ver nuestros trabajos más recientes y estar al día con nuestras novedades
        </p>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; width: 100%;">
          <a href="${BUSINESS_INFO.instagramUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/Jf2caEg.png" alt="Instagram" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">Instagram</span>
          </a>
          
          <a href="${BUSINESS_INFO.tiktokUrl}" target="_blank" style="
            display: inline-flex;
            align-items: center;
            padding: 15px 25px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            margin: 5px;
            min-width: 140px;
            justify-content: center;
          ">
            <img src="https://i.imgur.com/o3xzf71.png" alt="TikTok" style="
              width: 24px;
              height: 24px;
              margin-right: 10px;
              filter: brightness(0) invert(1);
            ">
            <span style="font-weight: 600; font-size: 14px;">TikTok</span>
          </a>
        </div>
      </div>
    `;

    await this.sendEmailWithGmailAPI(
      to,
      `Tu Reseña Ha Sido Aprobada - ${BUSINESS_INFO.businessName}`,
      emailTemplate(content)
    );
  }

  async sendTokenRenewalNotification(
    to: string,
    provider: string,
    status: 'success' | 'error',
    errorMessage?: string
  ) {
    const providerName = provider === 'google_drive' ? 'Google Drive' : provider;
    
    let content = '';
    let subject = '';
    
    if (status === 'success') {
      subject = `✅ Token de ${providerName} Renovado Exitosamente`;
      content = `
        <h2>✅ Token Renovado Exitosamente</h2>
        <p>El token de <strong>${providerName}</strong> ha sido renovado automáticamente.</p>
        <div class="appointment-details">
          <p><strong>Servicio:</strong> ${providerName}</p>
          <p><strong>Estado:</strong> ✅ Conectado y funcionando</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <p>Tu servicio de ${providerName} está funcionando correctamente. No necesitas hacer nada más.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `;
    } else {
      subject = `⚠️ Error Renovando Token de ${providerName}`;
      content = `
        <h2>⚠️ Error en Renovación de Token</h2>
        <p>Hubo un problema al renovar el token de <strong>${providerName}</strong>.</p>
        <div class="appointment-details">
          <p><strong>Servicio:</strong> ${providerName}</p>
          <p><strong>Estado:</strong> ❌ Necesita atención manual</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          ${errorMessage ? `<p><strong>Error:</strong> ${errorMessage}</p>` : ''}
        </div>
        <p>Por favor, ve al panel de administración y reconecta el servicio manualmente.</p>
        <a href="${env.FRONTEND_URL}/rachell-admin" class="button" target="_blank">Ir al Panel de Administración</a>
        <p>Si el problema persiste, contacta al soporte técnico.</p>
      `;
    }

    await this.sendEmailWithGmailAPI(
      to,
      subject,
      emailTemplate(content)
    );
  }
}

export const emailService = new EmailService(); 