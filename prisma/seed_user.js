const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run the demo-user seed script in production.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@swasthx.dev';
  // Local-dev-only fallback password; override with SEED_DEMO_PASSWORD if needed.
  const password = process.env.SEED_DEMO_PASSWORD || 'demo1234';

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
