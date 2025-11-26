import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';


async function main() {
  console.log('Seeding started...');

  const passwordPlain = 'demo1234'; 
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  await prisma.user.upsert({
    where: { email: 'demo@swasthx.test' },
    update: {
      // ✅ when user already exists, also update these fields
      name: 'Demo User',
      hashedPassword,          // <— this is the key line
      emailVerified: null,     // optional, just to be explicit
    },
    create: {
      email: 'demo@swasthx.test',
      name: 'Demo User',
      hashedPassword,
      emailVerified: null,     // optional
    },
  });
  
  const meals = [
    {
      title: 'Oats with Milk & Banana',
      calories: 400,
      proteinG: 12,
      fatG: 8,
      carbsG: 70,
      tags: ['veg'],
    },
    {
      title: 'Grilled Chicken Salad',
      calories: 450,
      proteinG: 40,
      fatG: 18,
      carbsG: 20,
      tags: ['non-veg', 'gluten-free'],
    },
    {
      title: 'Paneer Bhurji with Roti',
      calories: 550,
      proteinG: 30,
      fatG: 25,
      carbsG: 40,
      tags: ['veg'],
    }
  ];

  for (const m of meals) {
    await prisma.meal.upsert({
      where: { title: m.title },
      update: {},
      create: m,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
