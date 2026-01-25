const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@swasthx.dev';
  const password = 'demo1234';

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      hashedPassword,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: 'Demo User',
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Demo user seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
