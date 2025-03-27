import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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

  console.log('🌱 Iniciando seeding...');

  for (const admin of adminUsers) {
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
      console.log(`✅ Usuario admin creado: ${admin.name}`);
    } else {
      console.log(`⚠️ Usuario ${admin.name} ya existe`);
    }
  }

  console.log('✅ Seeding completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 