// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // sample user
  await prisma.user.upsert({
    where: { email: 'demo@swasthx.test' },
    update: {},
    create: {
      email: 'demo@swasthx.test',
      name: 'Demo User',
    },
  });

  // sample meals
  const meals = [
    {
      title: 'Oats with Milk & Banana',
      calories: 400,
      proteinG: 12,
      fatG: 8,
      carbsG: 70,
      tags: JSON.stringify(['veg']),
    },
    {
      title: 'Grilled Chicken Salad',
      calories: 450,
      proteinG: 40,
      fatG: 18,
      carbsG: 20,
      tags: JSON.stringify(['non-veg','gluten-free']),
    },
    {
      title: 'Paneer Bhurji with Roti',
      calories: 550,
      proteinG: 30,
      fatG: 25,
      carbsG: 40,
      tags: JSON.stringify(['veg']),
    }
  ];

  for (const m of meals) {
    await prisma.meal.upsert({
      where: { title: m.title },
      update: {},
      create: m,
    });
  }

  // sample exercises
  const exercises = [
    { name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell / Bodyweight', difficulty: 'INTERMEDIATE', instructions: 'Keep chest up, drive through heels.', repsTemplate: '3 sets x 8-12 reps' },
    { name: 'Push-up', muscleGroup: 'Chest', equipment: 'Bodyweight', difficulty: 'BEGINNER', instructions: 'Keep core tight, full ROM.', repsTemplate: '3 sets x 10-15 reps' },
    { name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'BEGINNER', instructions: 'Hold neutral spine.', repsTemplate: '3 x 30-60s' }
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: ex,
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
