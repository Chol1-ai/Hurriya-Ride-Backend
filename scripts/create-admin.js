const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name && !email && !password) {
    console.log('Admin provisioning skipped: ADMIN_* variables are not configured');
    return;
  }

  if (!name || !email || !password || password.length < 12) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashedPassword, role: 'ADMIN' },
    create: { name, email, password: hashedPassword, role: 'ADMIN' },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log(`Admin account provisioned: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });