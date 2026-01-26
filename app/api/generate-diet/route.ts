// app/api/generate-diet/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DietRequestSchema } from "@/lib/schemas";
import { MealType, GoalType, DietType } from "@prisma/client";
import { buildDietPlan } from "@/lib/tdee";

// Helper to calculate meal targets based on daily targets and meal count
function calculateMealTargets(dailyTargets: any, mealCount: number = 4) {
  let mealRatios: Record<string, number>;

  if (mealCount === 4) {
    // 4 meals for <2000 kcal or fallback
    mealRatios = {
      BREAKFAST: 0.25,
      LUNCH: 0.30,
      DINNER: 0.30,
      SNACK: 0.15,
    };
  } else if (mealCount === 5) {
    // Adjusted for 5 meals
    mealRatios = {
      BREAKFAST: 0.225,
      LUNCH: 0.25,
      DINNER: 0.20,
      SNACK1: 0.15,
      SNACK2: 0.175,
    };
  } else if (mealCount === 6) {
    // Original for 6 meals
    mealRatios = {
      BREAKFAST: 0.225,
      LUNCH: 0.25,
      DINNER: 0.15,
      SNACK1: 0.125,
      SNACK2: 0.125,
      SNACK3: 0.125,
    };
  } else {
    throw new Error("Unsupported meal count");
  }

  const mealTargets: Record<string, any> = {};

  // Calculate targets for each meal slot
  for (const slot in mealRatios) {
    const ratio = mealRatios[slot];
    
    mealTargets[slot] = {
      calories: {
        min: Math.round(dailyTargets.calories.min * ratio),
        max: Math.round(dailyTargets.calories.max * ratio),
        avg: Math.round(dailyTargets.calories.avg * ratio)
      },
      protein: {
        min: Math.round(dailyTargets.protein.min * ratio),
        max: Math.round(dailyTargets.protein.max * ratio),
        avg: Math.round(dailyTargets.protein.avg * ratio)
      },
      carbs: {
        min: Math.round(dailyTargets.carbs.min * ratio),
        max: Math.round(dailyTargets.carbs.max * ratio),
        avg: Math.round(dailyTargets.carbs.avg * ratio)
      },
      fat: {
        min: Math.round(dailyTargets.fat.min * ratio),
        max: Math.round(dailyTargets.fat.max * ratio),
        avg: Math.round(dailyTargets.fat.avg * ratio)
      }
    };
  }

  return mealTargets;
}

// Helper function to generate diet with given meal count
async function generateDietWithMealCount(
  dailyTargets: any,
  goal: GoalType,
  dietType: DietType,
  mealCount: number,
  calorieBuffer: number = 0.15
) {
  const mealTargets = calculateMealTargets(dailyTargets, mealCount);

  // Get meals for each type with calorie targeting
  async function getAvailableMeals(mealType: MealType, target: any) {
    try {        
      const minCalories = Math.round(target.calories.avg * (1 - calorieBuffer));
      const maxCalories = Math.round(target.calories.avg * (1 + calorieBuffer));

      console.log(`Fetching ${mealType} meals:`, { minCalories, maxCalories });

      const meals = await prisma.meal.findMany({
        where: {
          mealType,
          goal,
          dietType,
          isPublished: true,
          calories: {
            gte: minCalories,
            lte: maxCalories
          }
        },
        take: 100,
      });
      
      console.log(`Found ${meals.length} meals for ${mealType}`);
      return meals;
    } catch (error) {
      console.error(`Error fetching meals for ${mealType}:`, error);
      return [];
    }
  }

  const breakfastMeals = await getAvailableMeals(MealType.BREAKFAST, mealTargets.BREAKFAST);
  const lunchMeals = await getAvailableMeals(MealType.LUNCH, mealTargets.LUNCH);
  const dinnerMeals = await getAvailableMeals(MealType.DINNER, mealTargets.DINNER);
  const snackTarget = mealTargets[Object.keys(mealTargets).find(key => key.startsWith('SNACK')) || 'SNACK'];
  const snackMeals = await getAvailableMeals(MealType.SNACK, snackTarget);

  console.log('Available meals count:', {
    breakfast: breakfastMeals.length,
    lunch: lunchMeals.length,
    dinner: dinnerMeals.length,
    snack: snackMeals.length
  });

  if (breakfastMeals.length === 0 || lunchMeals.length === 0 || dinnerMeals.length === 0 || snackMeals.length === 0) {
    return null; // Not enough meals, fallback to lower count or wider buffer
  }

  // 🔒 Paneer usage tracker (veg only) - limit to max 1 paneer meal per day
  let paneerUsed = false;

  function canUsePaneer(meal: any) {
    if (dietType !== DietType.VEG) return true;
    if (!meal.ingredients.toLowerCase().includes("paneer")) return true;
    return !paneerUsed;
  }

  // Try multiple times to find a combination that matches targets
  let bestCombination: any = null;
  let bestScore = Infinity;
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selectedMeals: Record<string, any> = {};
    const usedSnackIds: Set<number> = new Set();
    const usedSnackTitles: Set<string> = new Set();
    
    paneerUsed = false;

    const slots = mealCount === 4 
      ? ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
      : mealCount === 5 
        ? ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK1', 'SNACK2']
        : ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK1', 'SNACK2', 'SNACK3'];

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    let valid = true;

    for (const slot of slots) {
      let mealsPool: any[];
      let target = mealTargets[slot];
      let mealType: MealType;

      if (slot.startsWith('SNACK')) {
        mealsPool = snackMeals;
        mealType = MealType.SNACK;
      } else if (slot === 'BREAKFAST') {
        mealsPool = breakfastMeals;
        mealType = MealType.BREAKFAST;
      } else if (slot === 'LUNCH') {
        mealsPool = lunchMeals;
        mealType = MealType.LUNCH;
      } else {
        mealsPool = dinnerMeals;
        mealType = MealType.DINNER;
      }

      if (mealsPool.length === 0) {
        valid = false;
        break;
      }

      let available = mealsPool.filter(meal => 
        canUsePaneer(meal) && (slot.startsWith('SNACK') ? (!usedSnackIds.has(meal.id) && !usedSnackTitles.has(meal.title)) : true)
      );
      
      if (available.length === 0 && dietType === DietType.VEG) {
        available = mealsPool.filter(meal => slot.startsWith('SNACK') ? (!usedSnackIds.has(meal.id) && !usedSnackTitles.has(meal.title)) : true);
      }
      
      if (available.length === 0) {
        valid = false;
        break;
      }

      const scoredMeals = available.map(meal => {
        const calorieDiff = Math.abs(meal.calories - target.calories.avg);
        const proteinDiff = Math.abs(meal.proteinG - target.protein.avg);
        const carbsDiff = Math.abs(meal.carbsG - target.carbs.avg);
        const volume = meal.ingredients.split(';').reduce((sum: number, ing: string) => {
          const weightMatch = ing.match(/\d+(\.\d+)?/);
          return sum + (weightMatch ? parseFloat(weightMatch[0]) : 0);
        }, 0);
        const score = calorieDiff + proteinDiff + carbsDiff + (volume > 500 ? volume * 0.2 : 0);
        
        return { meal, score };
      });

      scoredMeals.sort((a, b) => a.score - b.score);

      const topN = Math.min(3, scoredMeals.length);
      const randomIndex = Math.floor(Math.random() * topN);
      let selectedMeal = scoredMeals[randomIndex].meal;

      const scale = Math.min(2, Math.max(0.8, target.calories.avg / selectedMeal.calories));

      const scaledMeal = {
        ...selectedMeal,
        scale,
        calories: Math.round(selectedMeal.calories * scale),
        proteinG: Math.round(selectedMeal.proteinG * scale),
        carbsG: Math.round(selectedMeal.carbsG * scale),
        fatG: Math.round(selectedMeal.fatG * scale),
        ingredients: selectedMeal.ingredients.split(';').map((ing: string) => {
          const match = ing.match(/(\D+)(\d+(\.\d+)?)(\D*)/);
          if (match) {
            const [, name, num, , unit] = match;
            return `${name.trim()} ${Math.round(parseFloat(num) * scale)}${unit}`;
          }
          return ing;
        }).join('; '),
      };

      selectedMeals[slot] = scaledMeal;

      totalCalories += scaledMeal.calories;
      totalProtein += scaledMeal.proteinG;
      totalCarbs += scaledMeal.carbsG;
      totalFat += scaledMeal.fatG;

      if (dietType === DietType.VEG && scaledMeal.ingredients.toLowerCase().includes("paneer")) {
        paneerUsed = true;
      }

      if (slot.startsWith('SNACK')) {
        usedSnackIds.add(selectedMeal.id);
        usedSnackTitles.add(selectedMeal.title);
      }
    }

    if (!valid) continue;

    const calorieDiff = Math.abs(totalCalories - dailyTargets.calories.avg);
    const proteinDiff = Math.abs(totalProtein - dailyTargets.protein.avg);
    const carbsDiff = Math.abs(totalCarbs - dailyTargets.carbs.avg);
    const fatDiff = Math.abs(totalFat - dailyTargets.fat.avg);
    const totalScore = (calorieDiff * 1) + (proteinDiff * 0.5) + (carbsDiff * 0.3) + (fatDiff * 0.2);

    if (totalScore < bestScore) {
      bestScore = totalScore;
      bestCombination = {
        meals: selectedMeals,
        totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat }
      };

      if (totalScore < 200) break;
    }
  }

  if (!bestCombination) {
    // Fallback within the meal count
    console.warn(`Could not find optimal combination for ${mealCount} meals, using fallback within count`);
    const fallbackMeals: Record<string, any> = {};
    fallbackMeals.BREAKFAST = breakfastMeals[0] || null;
    fallbackMeals.LUNCH = lunchMeals[0] || null;
    fallbackMeals.DINNER = dinnerMeals[0] || null;

    const usedFallbackSnackTitles = new Set<string>();
    const usedFallbackSnackIds = new Set<number>();
    let snackIndex = 0;
    const snackSlots = mealCount === 4 ? ['SNACK'] : mealCount === 5 ? ['SNACK1', 'SNACK2'] : ['SNACK1', 'SNACK2', 'SNACK3'];
    for (const slot of snackSlots) {
      let selectedSnack = null;
      while (snackIndex < snackMeals.length && !selectedSnack) {
        const candidate = snackMeals[snackIndex];
        if (!usedFallbackSnackIds.has(candidate.id) && !usedFallbackSnackTitles.has(candidate.title)) {
          selectedSnack = candidate;
          usedFallbackSnackIds.add(candidate.id);
          usedFallbackSnackTitles.add(candidate.title);
        }
        snackIndex++;
      }
      fallbackMeals[slot] = selectedSnack || null;
    }

    // Scale each
    for (const slot in fallbackMeals) {
      const meal = fallbackMeals[slot];
      if (meal) {
        const target = mealTargets[slot];
        const scale = Math.min(2, Math.max(0.8, target.calories.avg / meal.calories));
        fallbackMeals[slot] = {
          ...meal,
          scale,
          calories: Math.round(meal.calories * scale),
          proteinG: Math.round(meal.proteinG * scale),
          carbsG: Math.round(meal.carbsG * scale),
          fatG: Math.round(meal.fatG * scale),
          ingredients: meal.ingredients.split(';').map((ing: string) => {
            const match = ing.match(/(\D+)(\d+(\.\d+)?)(\D*)/);
            if (match) {
              const [, name, num, , unit] = match;
              return `${name.trim()} ${Math.round(parseFloat(num) * scale)}${unit}`;
            }
            return ing;
          }).join('; '),
        };
      }
    }

    const fallbackTotals = Object.values(fallbackMeals).reduce((acc: any, meal: any) => {
      if (!meal) return acc;
      acc.calories += meal.calories;
      acc.protein += meal.proteinG;
      acc.carbs += meal.carbsG;
      acc.fat += meal.fatG;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      meals: fallbackMeals,
      totals: fallbackTotals
    };
  }

  return bestCombination;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = DietRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const payload = parsed.data;

    // Build diet plan based on user input
    const plan = buildDietPlan(payload);

    const goal: GoalType =
      payload.goal === "ENDURANCE" ? GoalType.MAINTENANCE : payload.goal;

    const dietType: DietType =
      payload.dietPreference === "NON_VEG" ? DietType.NON_VEG : DietType.VEG;

    // Calculate target ranges for the day
    const dailyTargets = {
      calories: {
        min: plan.totalCalories.min,
        max: plan.totalCalories.max,
        avg: Math.round((plan.totalCalories.min + plan.totalCalories.max) / 2)
      },
      protein: {
        min: plan.proteinG.min,
        max: plan.proteinG.max,
        avg: Math.round((plan.proteinG.min + plan.proteinG.max) / 2)
      },
      carbs: {
        min: plan.carbsG.min,
        max: plan.carbsG.max,
        avg: Math.round((plan.carbsG.min + plan.carbsG.max) / 2)
      },
      fat: {
        min: plan.fatG.min,
        max: plan.fatG.max,
        avg: Math.round((plan.fatG.min + plan.fatG.max) / 2)
      }
    };

    console.log('Daily Targets:', dailyTargets);

    let mealCount = dailyTargets.calories.avg < 2000 ? 4 : 6;
    let dietResult = null;
    let buffer = 0.15;

    while (mealCount >= 4 && !dietResult) {
      dietResult = await generateDietWithMealCount(dailyTargets, goal, dietType, mealCount, buffer);
      if (!dietResult) {
        // First, try wider buffer for same meal count
        buffer += 0.1;
        if (buffer > 0.5) {
          // If buffer too wide, reduce meal count
          mealCount--;
          buffer = 0.15;
        }
        console.log(`No combination found for ${mealCount} meals with buffer ${buffer - 0.1}, trying wider buffer or lower count.`);
      }
    }

    if (!dietResult) {
      return NextResponse.json({
        ok: false,
        error: "Unable to generate diet plan with available meals."
      }, { status: 500 });
    }

    console.log('Selected meals totals:', dietResult.totals);
    console.log('Targets:', dailyTargets);

    // Prepare response
    const response: any = {
      ok: true,
      plan,
      meals: dietResult.meals,
      planId: Date.now(),
      totals: dietResult.totals,
    };

    if (dailyTargets.calories.avg > 3000) {
      response.note = "Portions scaled for your needs—split meals if needed.";
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}