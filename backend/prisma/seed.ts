import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 RAILWAY DEPLOYMENT - SEED PROCESS STARTING');
  console.log('================================================');
  console.log('📋 Ambiente: ' + process.env.NODE_ENV);
  console.log('📅 Fecha y hora: ' + new Date().toISOString());
  console.log('================================================');

  const adminUsers = [
    {
      name: 'Aldair',
      email: 'aldair@rachellnails.com',
      password: 'Admin123!',
    },
    {
      name: 'Gabriel',
      email: 'gabriel@rachellnails.com',
      password: 'Admin123!',
    },
    {
      name: 'Rachell',
      email: 'rachell@rachellnails.com',
      password: 'Admin123!',
    },
  ];

  console.log('🌱 Iniciando seeding de usuarios administradores...');
  console.log('📊 Total de usuarios a procesar: ' + adminUsers.length);

  // Verificar la conexión a la base de datos
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a la base de datos establecida correctamente');
  } catch (e) {
    console.error('❌ Error al conectar con la base de datos:', e);
    throw e;
  }

  // Contador para estadísticas
  let created = 0;
  let existing = 0;

  for (const admin of adminUsers) {
    console.log(`🔍 Procesando usuario: ${admin.email}`);
    
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: admin.email },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await prisma.user.create({
          data: {
            name: admin.name,
            email: admin.email,
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
        console.log(`✅ Usuario admin creado: ${admin.name} (${admin.email})`);
        created++;
      } else {
        console.log(`⚠️ Usuario ${admin.name} (${admin.email}) ya existe en la base de datos`);
        existing++;
      }
    } catch (error) {
      console.error(`❌ Error al procesar usuario ${admin.email}:`, error);
    }
  }

  console.log('================================================');
  console.log('📊 RESUMEN DE SEED:');
  console.log(`✅ Usuarios creados: ${created}`);
  console.log(`⚠️ Usuarios existentes: ${existing}`);
  console.log(`📋 Total procesados: ${created + existing}`);
  console.log('================================================');
  console.log('✅ Proceso de seeding completado!');
}

main()
  .catch((e) => {
    console.error('❌ ERROR CRÍTICO EN SEEDING:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Cerrando conexión con la base de datos...');
    await prisma.$disconnect();
    console.log('👋 Proceso de seed finalizado');
  }); 