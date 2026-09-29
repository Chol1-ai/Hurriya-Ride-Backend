const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDemoData() {
  const password = await bcrypt.hash('Password123!', 10);

  const demoPassenger = await prisma.user.upsert({
    where: { email: 'demo@hurriya.io' },
    update: {},
    create: {
      name: 'Demo Passenger',
      email: 'demo@hurriya.io',
      password,
      role: 'PASSENGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'driver@hurriya.io' },
    update: {},
    create: {
      name: 'Driver Ops',
      email: 'driver@hurriya.io',
      password,
      role: 'DRIVER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'fleet@hurriya.io' },
    update: {},
    create: {
      name: 'Fleet Ops',
      email: 'fleet@hurriya.io',
      password,
      role: 'FLEET',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@hurriya.io' },
    update: {},
    create: {
      name: 'Admin Ops',
      email: 'admin@hurriya.io',
      password,
      role: 'ADMIN',
    },
  });

  await prisma.driver.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Amin Yusuf',
      phone: '+211912345678',
      vehicle: 'Boda',
      status: 'AVAILABLE',
      rating: 4.8,
    },
  });

  await prisma.driver.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Deng Wani',
      phone: '+211923456789',
      vehicle: 'Car',
      status: 'AVAILABLE',
      rating: 4.9,
    },
  });

  return {
    demoPassenger: demoPassenger.email,
    driver: 'driver@hurriya.io',
    fleet: 'fleet@hurriya.io',
    admin: 'admin@hurriya.io',
  };
}

async function main() {
  const seeded = await seedDemoData();
  console.log('Seeded demo users and drivers:', seeded);
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { seedDemoData };
