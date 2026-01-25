// app/api/generate-diet/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DietRequestSchema } from "@/lib/schemas";
import { MealType, GoalType, DietType } from "@prisma/client";
import { buildDietPlan } from "@/lib/tdee";

// Helper to calculate meal targets based on daily targets
function calculateMealTargets(dailyTargets: any, mealsPerDay: number = 4) {
  // Define distribution ratios for 4 meals
  const mealRatios = {
    [MealType.BREAKFAST]: 0.25,  // 25%
    [MealType.LUNCH]: 0.30,      // 30%
    [MealType.DINNER]: 0.30,     // 30%
    [MealType.SNACK]: 0.15,      // 15%
  };

  const mealTargets: Record<MealType, any> = {
    [MealType.BREAKFAST]: {},
    [MealType.LUNCH]: {},
    [MealType.DINNER]: {},
    [MealType.SNACK]: {},
  };

  // Calculate targets for each meal type
  for (const mealType in mealRatios) {
    const ratio = mealRatios[mealType as MealType];
    
    mealTargets[mealType as MealType] = {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = DietRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const payload = parsed.data;

    // ✅ Build diet plan based on user input
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

    // Calculate meal-specific targets
    const mealTargets = calculateMealTargets(dailyTargets);
    console.log('Meal Targets:', mealTargets);

    // Get meals for each type with calorie targeting
    async function getAvailableMeals(mealType: MealType) {
      try {
        const targets = mealTargets[mealType];
        
        // Get meals within ±25% of target calorie range
        const calorieBuffer = 0.25; // 25% buffer
        const minCalories = Math.round(targets.calories.avg * (1 - calorieBuffer));
        const maxCalories = Math.round(targets.calories.avg * (1 + calorieBuffer));

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
          take: 100, // Get more options
        });
        
        console.log(`Found ${meals.length} meals for ${mealType}`);
        return meals;
      } catch (error) {
        console.error(`Error fetching meals for ${mealType}:`, error);
        return [];
      }
    }

    // Get all available meals
    const [breakfastMeals, lunchMeals, dinnerMeals, snackMeals] = await Promise.all([
      getAvailableMeals(MealType.BREAKFAST),
      getAvailableMeals(MealType.LUNCH),
      getAvailableMeals(MealType.DINNER),
      getAvailableMeals(MealType.SNACK),
    ]);

    console.log('Available meals count:', {
      breakfast: breakfastMeals.length,
      lunch: lunchMeals.length,
      dinner: dinnerMeals.length,
      snack: snackMeals.length
    });

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
    const maxAttempts = 200; // Increased attempts for better matching

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const selectedMeals: any[] = [];
      
      // Reset paneer tracker for each attempt
      paneerUsed = false;

      // Select meals for each type
      const mealTypes = [
        { type: MealType.BREAKFAST, meals: breakfastMeals, target: mealTargets[MealType.BREAKFAST] },
        { type: MealType.LUNCH, meals: lunchMeals, target: mealTargets[MealType.LUNCH] },
        { type: MealType.DINNER, meals: dinnerMeals, target: mealTargets[MealType.DINNER] },
        { type: MealType.SNACK, meals: snackMeals, target: mealTargets[MealType.SNACK] },
      ];

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      for (const { type, meals, target } of mealTypes) {
        if (meals.length === 0) {
          selectedMeals.push(null);
          continue;
        }

        // Filter available meals for this type
        let available = meals.filter(meal => canUsePaneer(meal));
        
        // If no meals available without paneer, allow paneer
        if (available.length === 0 && dietType === DietType.VEG) {
          available = meals;
        }
        
        if (available.length === 0) {
          selectedMeals.push(null);
          continue;
        }

        // Sort meals by how close they are to the target
        const scoredMeals = available.map(meal => {
          const calorieDiff = Math.abs(meal.calories - target.calories.avg);
          const proteinDiff = Math.abs(meal.proteinG - target.protein.avg);
          const carbsDiff = Math.abs(meal.carbsG - target.carbs.avg);
          const score = calorieDiff + proteinDiff + carbsDiff;
          
          return { meal, score };
        });

        // Sort by score (lower is better)
        scoredMeals.sort((a, b) => a.score - b.score);

        // Take one of the top 3 meals randomly for variety
        const topN = Math.min(3, scoredMeals.length);
        const randomIndex = Math.floor(Math.random() * topN);
        const selectedMeal = scoredMeals[randomIndex].meal;
        
        selectedMeals.push(selectedMeal);
        
        // Update totals
        totalCalories += selectedMeal.calories;
        totalProtein += selectedMeal.proteinG;
        totalCarbs += selectedMeal.carbsG;
        totalFat += selectedMeal.fatG;

        // Track paneer usage
        if (
          dietType === DietType.VEG &&
          selectedMeal.ingredients.toLowerCase().includes("paneer")
        ) {
          paneerUsed = true;
        }
      }

      // Check if we have all meals
      const allMeals = selectedMeals.filter(Boolean);
      if (allMeals.length < 4) continue;

      // Calculate how close we are to targets
      const calorieDiff = Math.abs(totalCalories - dailyTargets.calories.avg);
      const proteinDiff = Math.abs(totalProtein - dailyTargets.protein.avg);
      const carbsDiff = Math.abs(totalCarbs - dailyTargets.carbs.avg);
      const fatDiff = Math.abs(totalFat - dailyTargets.fat.avg);
      
      // Weight the differences (calories are most important)
      const totalScore = (calorieDiff * 1) + (proteinDiff * 0.5) + (carbsDiff * 0.3) + (fatDiff * 0.2);

      // If this combination is perfect or better than previous
      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestCombination = {
          BREAKFAST: selectedMeals[0],
          LUNCH: selectedMeals[1],
          DINNER: selectedMeals[2],
          SNACK: selectedMeals[3],
          totals: {
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat
          }
        };

        // If score is very good, break early
        if (totalScore < 200) break;
      }
    }

    if (!bestCombination) {
      // Fallback: use the best we could find from available meals
      console.warn("Could not find optimal combination, using fallback");
      
      const fallbackMeals = {
        BREAKFAST: breakfastMeals.length > 0 ? breakfastMeals[0] : null,
        LUNCH: lunchMeals.length > 0 ? lunchMeals[0] : null,
        DINNER: dinnerMeals.length > 0 ? dinnerMeals[0] : null,
        SNACK: snackMeals.length > 0 ? snackMeals[0] : null,
      };

      // Calculate fallback totals
      const fallbackTotals = Object.values(fallbackMeals).reduce((acc, meal) => {
        if (!meal) return acc;
        acc.calories += meal.calories;
        acc.protein += meal.proteinG;
        acc.carbs += meal.carbsG;
        acc.fat += meal.fatG;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      return NextResponse.json({
        ok: true,
        plan,
        meals: fallbackMeals,
        planId: Date.now(),
        totals: fallbackTotals,
        warning: "Could not find optimal meal combination, using available meals",
      });
    }

    console.log('Selected meals totals:', bestCombination.totals);
    console.log('Targets:', dailyTargets);

    // Return response
    return NextResponse.json({
      ok: true,
      plan,
      meals: {
        BREAKFAST: bestCombination.BREAKFAST,
        LUNCH: bestCombination.LUNCH,
        DINNER: bestCombination.DINNER,
        SNACK: bestCombination.SNACK,
      },
      planId: Date.now(),
      totals: bestCombination.totals,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}