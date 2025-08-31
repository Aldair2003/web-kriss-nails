import nodemailer from 'nodemailer';
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
        
        .social-links-container {
          display: flex;
          gap: 40px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin: 30px 0;
        }
        
        .social-link-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          transition: all 0.3s ease;
          padding: 15px 25px;
          border-radius: 15px;
          background: linear-gradient(135deg, #f8bbd0 0%, #fce4ec 100%);
          border: 2px solid #f8bbd0;
          min-width: 120px;
        }
        
        .social-link-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(248, 187, 208, 0.4);
          background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
        }
        
        .social-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 8px;
          display: block;
          border-radius: 8px;
        }
        
        .social-name {
          color: #333;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          margin: 0;
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
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD
      }
    });
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
      <p>¡Gracias por confiar en ${BUSINESS_INFO.businessName}!</p>
      <p>Síguenos en nuestras redes sociales para ver nuestros trabajos más recientes:</p>
      <div class="social-links-container">
        <a href="${BUSINESS_INFO.instagramUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/instagram.webp" alt="Instagram" class="social-icon">
          <span class="social-name">Instagram</span>
        </a>
        <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/tiktok.webp" alt="TikTok" class="social-icon">
          <span class="social-name">TikTok</span>
        </a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      to,
      subject: `Confirmación de Cita - ${BUSINESS_INFO.businessName}`,
      html: emailTemplate(content)
    });
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
      <p>Mientras tanto, puedes ver nuestros trabajos más recientes en nuestras redes sociales:</p>
      <div class="social-links-container">
        <a href="${BUSINESS_INFO.instagramUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/instagram.webp" alt="Instagram" class="social-icon">
          <span class="social-name">Instagram</span>
        </a>
        <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/tiktok.webp" alt="TikTok" class="social-icon">
          <span class="social-name">TikTok</span>
        </a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      to,
      subject: `Recordatorio de Cita - ${BUSINESS_INFO.businessName}`,
      html: emailTemplate(content)
    });
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
      <p>Mientras tanto, puedes ver nuestros trabajos más recientes en nuestras redes sociales:</p>
      <div class="social-links-container">
        <a href="${BUSINESS_INFO.instagramUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/instagram.webp" alt="Instagram" class="social-icon">
          <span class="social-name">Instagram</span>
        </a>
        <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/tiktok.webp" alt="TikTok" class="social-icon">
          <span class="social-name">TikTok</span>
        </a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      to,
      subject: `Cita Cancelada - ${BUSINESS_INFO.businessName}`,
      html: emailTemplate(content)
    });
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
      <p>No olvides seguirnos en nuestras redes sociales para ver nuestros trabajos más recientes:</p>
      <div class="social-links-container">
        <a href="${BUSINESS_INFO.instagramUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/instagram.webp" alt="Instagram" class="social-icon">
          <span class="social-name">Instagram</span>
        </a>
        <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/tiktok.webp" alt="TikTok" class="social-icon">
          <span class="social-name">TikTok</span>
        </a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      to,
      subject: `Servicio Completado - ${BUSINESS_INFO.businessName}`,
      html: emailTemplate(content)
    });
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
      <p>Síguenos en nuestras redes sociales para ver nuestros trabajos más recientes:</p>
      <div class="social-links-container">
        <a href="${BUSINESS_INFO.instagramUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/instagram.webp" alt="Instagram" class="social-icon">
          <span class="social-name">Instagram</span>
        </a>
        <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/tiktok.webp" alt="TikTok" class="social-icon">
          <span class="social-name">TikTok</span>
        </a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      to,
      subject: `Nueva Reseña - ${BUSINESS_INFO.businessName}`,
      html: emailTemplate(content)
    });
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
      <p>Síguenos en nuestras redes sociales para ver nuestros trabajos más recientes:</p>
      <div class="social-links-container">
        <a href="${BUSINESS_INFO.instagramUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/instagram.webp" alt="Instagram" class="social-icon">
          <span class="social-name">Instagram</span>
        </a>
        <a href="${BUSINESS_INFO.tiktokUrl}" class="social-link-item" target="_blank">
          <img src="${env.VERCEL_URL}/icons/tiktok.webp" alt="TikTok" class="social-icon">
          <span class="social-name">TikTok</span>
        </a>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${BUSINESS_INFO.businessName}" <${env.EMAIL_USER}>`,
      to,
      subject: `Tu Reseña Ha Sido Aprobada - ${BUSINESS_INFO.businessName}`,
      html: emailTemplate(content)
    });
  }
}

export const emailService = new EmailService(); 