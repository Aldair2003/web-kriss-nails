# Kriss Beauty Nails

Sitio web profesional para el negocio de servicios de uñas de Kriss Beauty Nails. Una plataforma moderna y elegante que permite a los clientes explorar servicios, ver trabajos anteriores y agendar citas.

## 🌟 Características

- 💅 Catálogo de servicios con precios y duraciones
- 📅 Sistema de reservas en línea
- 🖼️ Galería de trabajos con integración a Google Drive
- 📱 Diseño responsive y animaciones fluidas
- ✨ Panel de administración para gestión de servicios
- 📧 Sistema de notificaciones por email
- 🔒 Autenticación segura
- 📊 Dashboard con estadísticas

## 🛠️ Tecnologías

### Frontend
- **Framework**: Next.js 15
- **Lenguaje**: TypeScript
- **Estilos**: 
  - Tailwind CSS
  - Tailwind Animations
  - Class Variance Authority
- **Componentes**:
  - Headless UI
  - Radix UI
  - Tremor (para dashboard)
  - Framer Motion (animaciones)
- **Formularios**: React Hook Form + Zod
- **Estado y Peticiones**:
  - Axios
  - React Context
- **UI/UX**:
  - Swiper
  - React Icons
  - Sonner (notificaciones)
  - Recharts (gráficos)

### Backend
- **Runtime**: Node.js con Express
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT + Cookies
- **Almacenamiento**: Google Cloud Storage
- **Email**: Nodemailer
- **Seguridad**:
  - Helmet
  - CORS
  - Rate Limiting
  - Express Validator
- **Documentación**: Swagger/OpenAPI
- **Logging**: Winston
- **Testing**: Jest

## 🚀 Instalación

### Prerequisitos
- Node.js 18 o superior
- PNPM como gestor de paquetes
- PostgreSQL
- Cuenta de Google Cloud (para almacenamiento)

### Frontend
\`\`\`bash
cd frontend
pnpm install
pnpm dev
\`\`\`

### Backend
\`\`\`bash
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
\`\`\`

## 🔧 Variables de Entorno

### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

### Backend (.env)
\`\`\`env
DATABASE_URL="postgresql://..."
GOOGLE_DRIVE_CLIENT_ID="..."
GOOGLE_DRIVE_CLIENT_SECRET="..."
GOOGLE_DRIVE_REDIRECT_URI="..."
JWT_SECRET="..."
\`\`\`

## 📁 Estructura del Proyecto

### Frontend
- `/src/app` - Rutas y páginas
- `/src/components` - Componentes reutilizables
- `/src/hooks` - Custom hooks
- `/src/lib` - Utilidades y configuraciones
- `/src/types` - Definiciones de tipos
- `/public` - Archivos estáticos

### Backend
- `/src/controllers` - Controladores de rutas
- `/src/services` - Lógica de negocio
- `/src/middlewares` - Middlewares personalizados
- `/src/config` - Configuraciones
- `/prisma` - Esquema y migraciones de base de datos

## 📄 Licencia

Este proyecto es privado y su uso está restringido. © 2024 Kriss Beauty Nails 
