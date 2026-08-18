import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DietRequestSchema } from "@/lib/schemas";
import { MealType, GoalType, DietType } from "@prisma/client";
import { buildDietPlan } from "@/lib/tdee";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const isDev = process.env.NODE_ENV !== "production";
const devLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

const MAX_PORTION_WEIGHT = 600;
const MAX_INGREDIENT_LIMITS: Record<string, number> = {
  'rice': 150, 'dal': 120, 'wheat': 100, 'dalia': 100, 'oats': 100,
  'quinoa': 100, 'pasta': 120, 'noodles': 120, 'bread': 4,
  'roti': 3, 'chapati': 3, 'paratha': 2,
  'paneer': 150, 'tofu': 150, 'soya': 100, 'chickpea': 150,
  'sprout': 200, 'chana': 100, 'lentil': 120, 'bean': 150,
  'curd': 200, 'yogurt': 200, 'milk': 300,
  'vegetable': 200, 'potato': 150, 'sweet potato': 150,
  'broccoli': 200, 'spinach': 150, 'carrot': 150,
  'cauliflower': 200, 'pea': 100, 'corn': 100,
  'banana': 2, 'apple': 2, 'orange': 2, 'mango': 1,
  'grape': 150, 'berry': 150, 'papaya': 200,
  'nut': 50, 'almond': 30, 'walnut': 30, 'peanut': 40,
  'seed': 30, 'flax': 20, 'chia': 20,
  'oil': 4, 'ghee': 2, 'butter': 2, 'cream': 2,
  'egg': 6, 'chicken': 300, 'fish': 300, 'keema': 200,
};

// Sorted longest-key-first so a specific ingredient (e.g. "peanut") is matched
// before a shorter substring of it that happens to also be a valid key ("pea").
const SORTED_INGREDIENT_LIMITS = Object.entries(MAX_INGREDIENT_LIMITS).sort(
  (a, b) => b[0].length - a[0].length
);

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const INGREDIENT_NUTRITION: Record<string, Nutrition> = {
  'egg': { calories: 70, protein: 6, carbs: 0.5, fat: 5 },
  'eggs': { calories: 70, protein: 6, carbs: 0.5, fat: 5 },
  'wheat roti': { calories: 80, protein: 3, carbs: 15, fat: 1 },
  'oil tsp': { calories: 40, protein: 0, carbs: 0, fat: 4.5 },
  'rice': { calories: 1.3, protein: 0.025, carbs: 0.28, fat: 0.003 },
  'mixed vegetables': { calories: 0.5, protein: 0.01, carbs: 0.1, fat: 0.002 },
  'bread slice': { calories: 80, protein: 3, carbs: 15, fat: 1 },
  'rajma': { calories: 1.27, protein: 0.09, carbs: 0.23, fat: 0.005 },
  'moong dal': { calories: 1.05, protein: 0.07, carbs: 0.18, fat: 0.01 },
  'chicken breast': { calories: 1.65, protein: 0.31, carbs: 0, fat: 0.036 },
  'chicken keema': { calories: 1.65, protein: 0.31, carbs: 0, fat: 0.036 },
};

function findCalorieBracket(dailyCalories: number) {
  const base = 1000;
  const step = 200;
  if (dailyCalories < base) {
    return { bracketMin: base, bracketMax: base + step - 1 };
  }
  if (dailyCalories > 5000) {
    return { bracketMin: 4800, bracketMax: 4999 };
  }
  let bracketIndex = Math.floor((dailyCalories - base) / step);
  bracketIndex = Math.max(0, bracketIndex);
  const bracketMin = base + (bracketIndex * step);
  const bracketMax = bracketMin + step - 1;
  return { bracketMin, bracketMax };
}

function calculateMealTargets(dailyTargets: any, mealCount: number = 4) {
  let mealRatios: Record<string, number>;
  if (mealCount === 4) {
    mealRatios = {
      BREAKFAST: 0.25,
      LUNCH: 0.30,
      DINNER: 0.30,
      SNACK: 0.15,
    };
  } else if (mealCount === 5) {
    mealRatios = {
      BREAKFAST: 0.225,
      LUNCH: 0.25,
      DINNER: 0.20,
      SNACK1: 0.15,
      SNACK2: 0.175,
    };
  } else if (mealCount === 6) {
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

function calculateNutrition(ingredients: string): { calories: number; protein: number; carbs: number; fat: number; } | null {
  let cal = 0, p = 0, c = 0, f = 0;
  let allDefined = true;
  ingredients.split(';').map(ing => ing.trim()).filter(Boolean).forEach(ing => {
    const match = ing.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(\S*)$/);
    if (!match) {
      allDefined = false;
      return;
    }
    const [, name, amountStr, unit] = match;
    const amount = parseFloat(amountStr);
    let ingName = name.toLowerCase().trim();
    let key = ingName;
    if (unit) {
      if (unit !== 'g') {
        key += ' ' + unit.toLowerCase();
      }
    }
    const nut = INGREDIENT_NUTRITION[key];
    if (!nut) {
      allDefined = false;
      return;
    }
    cal += amount * nut.calories;
    p += amount * nut.protein;
    c += amount * nut.carbs;
    f += amount * nut.fat;
  });
  if (!allDefined) return null;
  return { calories: Math.round(cal), protein: Math.round(p), carbs: Math.round(c), fat: Math.round(f) };
}

async function getAvailableMeals(
  mealType: MealType,
  goal: GoalType,
  dietType: DietType,
  dailyCalories: number,
  targetCalories: number
) {
  try {
    const { bracketMin, bracketMax } = findCalorieBracket(dailyCalories);

    devLog(`Fetching ${mealType} meals:`, {
      goal,
      dietType,
      bracket: `${bracketMin}-${bracketMax}`,
      targetCalories
    });
    const meals = await prisma.meal.findMany({
      where: {
        mealType,
        goal,
        dietType,
        isPublished: true,
        dailyCalorieBracketMin: bracketMin,
        dailyCalorieBracketMax: bracketMax,
      },
      take: 100,
    });

    devLog(`Found ${meals.length} ${mealType} meals for ${dietType} ${goal}`);

    // Correct macros for egg-related meals
    const correctedMeals = meals.map(meal => {
      const isEggRelated = meal.title.toLowerCase().includes('egg');
      if (!isEggRelated) return meal;
      const baseNut = calculateNutrition(meal.ingredients);
      if (!baseNut) return meal;
      return {
        ...meal,
        calories: baseNut.calories,
        proteinG: baseNut.protein,
        carbsG: baseNut.carbs,
        fatG: baseNut.fat,
      };
    });

    return correctedMeals;
  } catch (error) {
    console.error(`Error fetching meals for ${mealType}:`, error);
    return [];
  }
}

function scaleMeal(meal: any, targetCalories: number) {
  let scale = meal.calories > 0 ? targetCalories / meal.calories : 1;
  scale = Math.max(0.3, Math.min(3.0, scale));
  // Non-veg meals get a wider scaling window since portions vary more.
  if (meal.dietType === DietType.NON_VEG) {
    scale = Math.max(0.5, Math.min(2.5, scale));
  }
  const ingredients = meal.ingredients.split(';').map((ing: string) => {
    const trimmed = ing.trim();
    if (!trimmed) return '';

    // Regex: name (non-greedy), amount (num), optional unit (non-space)
    const match = trimmed.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(\S*)$/);
    if (!match) return trimmed;

    const [, name, amountStr, unit] = match;
    const amount = parseFloat(amountStr) || 1;
    const ingName = name.toLowerCase().trim();

    let scaledAmount = amount * scale;

    for (const [key, limit] of SORTED_INGREDIENT_LIMITS) {
      if (ingName.includes(key)) {
        if (['egg', 'bread', 'roti', 'chapati', 'paratha'].includes(key)) {
          scaledAmount = Math.min(Math.round(scaledAmount), limit);
        } else {
          scaledAmount = Math.min(scaledAmount, limit);
        }
        break;
      }
    }

    if (unit === 'tsp' || unit === 'tbsp') {
      scaledAmount = Math.round(scaledAmount * 10) / 10;
    } else {
      scaledAmount = Math.round(scaledAmount);
    }

    return `${name.trim()} ${scaledAmount}${unit}`;
  }).join('; ');
  let scaledCalories = Math.round(meal.calories * scale);
  let scaledProtein = Math.round(meal.proteinG * scale);
  let scaledCarbs = Math.round(meal.carbsG * scale);
  let scaledFat = Math.round(meal.fatG * scale);

  // Recalculate for egg-related meals to ensure consistency after rounding/capping
  const isEggRelated = meal.title.toLowerCase().includes('egg');
  if (isEggRelated) {
    const scaledNut = calculateNutrition(ingredients);
    if (scaledNut) {
      scaledCalories = scaledNut.calories;
      scaledProtein = scaledNut.protein;
      scaledCarbs = scaledNut.carbs;
      scaledFat = scaledNut.fat;
    }
  }

  return {
    ...meal,
    scale,
    calories: scaledCalories,
    proteinG: scaledProtein,
    carbsG: scaledCarbs,
    fatG: scaledFat,
    ingredients: ingredients,
  };
}

async function generateDietWithMealCount(
  dailyTargets: any,
  goal: GoalType,
  dietType: DietType,
  mealCount: number
) {
  const dailyCalories = dailyTargets.calories.avg;
  const mealTargets = calculateMealTargets(dailyTargets, mealCount);
  devLog('\n=== Generating Diet Plan ===');
  devLog('Daily calories:', dailyCalories);
  devLog('Goal:', goal);
  devLog('Diet type:', dietType);
  devLog('Meal count:', mealCount);
  devLog('Meal targets:', mealTargets);
  const mealPools = {
    BREAKFAST: await getAvailableMeals(
      MealType.BREAKFAST,
      goal,
      dietType,
      dailyCalories,
      mealTargets.BREAKFAST.calories.avg
    ),
    LUNCH: await getAvailableMeals(
      MealType.LUNCH,
      goal,
      dietType,
      dailyCalories,
      mealTargets.LUNCH.calories.avg
    ),
    DINNER: await getAvailableMeals(
      MealType.DINNER,
      goal,
      dietType,
      dailyCalories,
      mealTargets.DINNER.calories.avg
    ),
    SNACK: await getAvailableMeals(
      MealType.SNACK,
      goal,
      dietType,
      dailyCalories,
      mealTargets[mealCount === 4 ? 'SNACK' : 'SNACK1']?.calories.avg || 200
    ),
  };
  devLog('\n=== Available Meals ===');
  devLog('Breakfast:', mealPools.BREAKFAST.length);
  devLog('Lunch:', mealPools.LUNCH.length);
  devLog('Dinner:', mealPools.DINNER.length);
  devLog('Snack:', mealPools.SNACK.length);
  if (
    mealPools.BREAKFAST.length === 0 ||
    mealPools.LUNCH.length === 0 ||
    mealPools.DINNER.length === 0 ||
    mealPools.SNACK.length === 0
  ) {
    console.error('Not enough meals available for the requested goal/diet/calorie bracket');
    return null;
  }
  const slots = mealCount === 4
    ? ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
    : mealCount === 5
      ? ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK1', 'SNACK2']
      : ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK1', 'SNACK2', 'SNACK3'];
  // For vegetarian, track paneer usage
  let paneerUsed = false;
  const usedMealTitles = new Set<string>();
  // Add tracking for chana group
  const chanaGroup = ['chana', 'sattu', 'besan'];
  let chanaGroupUsed = 0;
  const maxChanaGroup = 2; // Allow up to 2 uses per day to avoid too much restriction
  // Try multiple times to find a good combination
  let bestCombination: any = null;
  let bestScore = Infinity;
  const maxAttempts = 500;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selectedMeals: Record<string, any> = {};
    paneerUsed = false;
    chanaGroupUsed = 0;
  
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let valid = true;
    for (const slot of slots) {
      let pool: any[];
      let target: any;
    
      if (slot.startsWith('SNACK')) {
        pool = mealPools.SNACK;
        target = mealTargets[slot];
      } else {
        pool = mealPools[slot as keyof typeof mealPools];
        target = mealTargets[slot];
      }
      if (!pool || pool.length === 0) {
        valid = false;
        break;
      }
      // Filter available meals
      let available = [...pool];
    
      // For vegetarian diets, limit paneer to once per day
      if (dietType === DietType.VEG) {
        available = available.filter(meal => {
          if (!meal.ingredients.toLowerCase().includes("paneer")) return true;
          return !paneerUsed;
        });
      }
    
      // Avoid repeating exact same meal title
      available = available.filter(meal => !usedMealTitles.has(meal.title));
      // Filter to avoid overusing chana group
      available = available.filter(meal => {
        const mealIngs = meal.ingredients.toLowerCase();
        if (chanaGroup.some(g => mealIngs.includes(g)) && chanaGroupUsed >= maxChanaGroup) {
          return false;
        }
        return true;
      });
      // If no meals available, use any meal
      if (available.length === 0) {
        available = [...pool];
      }
      // Score meals based on how close they are to target
      const scoredMeals = available.map(meal => {
        const calorieDiff = Math.abs(meal.calories - target.calories.avg);
        const proteinDiff = Math.abs(meal.proteinG - target.protein.avg);
        const score = calorieDiff + proteinDiff * 0.5;
        return { meal, score };
      });
      // Sort by score and pick from top 5
      scoredMeals.sort((a, b) => a.score - b.score);
      const topN = Math.min(5, scoredMeals.length);
      const randomIndex = Math.floor(Math.random() * topN);
      const selectedMeal = scoredMeals[randomIndex]?.meal || available[0];
      // Scale meal to target
      const scaledMeal = scaleMeal(selectedMeal, target.calories.avg);
      selectedMeals[slot] = scaledMeal;
      usedMealTitles.add(selectedMeal.title);
      // Update totals
      totalCalories += scaledMeal.calories;
      totalProtein += scaledMeal.proteinG;
      totalCarbs += scaledMeal.carbsG;
      totalFat += scaledMeal.fatG;
      // Track paneer usage
      if (dietType === DietType.VEG && selectedMeal.ingredients.toLowerCase().includes("paneer")) {
        paneerUsed = true;
      }
      // Track chana group usage
      if (chanaGroup.some(g => selectedMeal.ingredients.toLowerCase().includes(g))) {
        chanaGroupUsed++;
      }
    }
    if (!valid) continue;
    // Calculate score for this combination
    const calorieDiff = Math.abs(totalCalories - dailyTargets.calories.avg);
    const proteinDiff = Math.abs(totalProtein - dailyTargets.protein.avg);
    const carbsDiff = Math.abs(totalCarbs - dailyTargets.carbs.avg);
  
    const score = calorieDiff + proteinDiff * 0.5 + carbsDiff * 0.2;
    if (score < bestScore) {
      bestScore = score;
      bestCombination = {
        meals: selectedMeals,
        totals: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat
        }
      };
      // Good enough score, break early
      if (score < 100) break;
    }
  }
  if (!bestCombination) {
    console.error(`Could not find a valid ${mealCount}-meal combination for goal=${goal} dietType=${dietType}`);
    return null;
  }
  if (isDev) {
    devLog('\n=== Selected Meals ===');
    for (const slot of slots) {
      const meal = bestCombination.meals[slot];
      devLog(`${slot}: ${meal.title} (${meal.calories} cal, ${meal.proteinG}g protein)`);
    }
    devLog('Total:', bestCombination.totals);
  }
  return bestCombination;
}
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = rateLimit(getClientIp(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }
  try {
    const body = await request.json();
    const parsed = DietRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: "Please check the highlighted fields and try again.",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }
    const payload = parsed.data;
    const plan = buildDietPlan(payload);
    const goal: GoalType = payload.goal;
    const dietType: DietType = payload.dietPreference === "NON_VEG" ? DietType.NON_VEG : DietType.VEG;
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
    if (isDev) {
      devLog('\n=== User Input ===');
      devLog('Age:', payload.age);
      devLog('Gender:', payload.gender);
      devLog('Weight:', payload.weightKg, 'kg');
      devLog('Height:', payload.heightCm, 'cm');
      devLog('Activity:', payload.activityLevel);
      devLog('Goal:', goal);
      devLog('Diet type:', dietType);
      devLog('Daily calories:', dailyTargets.calories.avg);
    }

    let mealCount = dailyTargets.calories.avg < 2000 ? 4 : 6;
    let dietResult = null;

    // calculateMealTargets only supports 4/5/6 meals a day; try the
    // preferred count first, then fall back to the other supported ones.
    const mealCountsToTry = [...new Set([mealCount, 5, 4, 6])].filter(c => c >= 4 && c <= 6);

    for (const count of mealCountsToTry) {
      devLog(`\nTrying ${count} meals...`);
      dietResult = await generateDietWithMealCount(dailyTargets, goal, dietType, count);
      if (dietResult) {
        mealCount = count;
        break;
      }
    }
    if (!dietResult) {
      console.error('Unable to generate diet plan for', { goal, dietType, dailyCalories: dailyTargets.calories.avg });
      return NextResponse.json({
        ok: false,
        error: "We couldn't build a diet plan with those preferences. Try adjusting your goal or diet type.",
        ...(isDev && {
          debug: {
            dailyCalories: dailyTargets.calories.avg,
            goal: goal,
            dietType: dietType,
            bracket: findCalorieBracket(dailyTargets.calories.avg)
          }
        })
      }, { status: 500 });
    }
    const response: any = {
      ok: true,
      plan: {
        ...plan,
        dailyTargets: dailyTargets
      },
      meals: dietResult.meals,
      totals: dietResult.totals,
      mealCount: mealCount,
      planId: crypto.randomUUID(),
    };
    if (dailyTargets.calories.avg > 3000) {
      response.note = "High calorie plan. Consider splitting meals if needed.";
    } else if (dailyTargets.calories.avg < 1500) {
      response.note = "Lower calorie plan. Stay hydrated and listen to hunger cues.";
    }
    if (dietType === DietType.VEG) {
      response.dietNote = "Vegetarian plan with diverse protein sources.";
    } else {
      response.dietNote = "Non-vegetarian plan with animal protein sources.";
    }
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating diet plan:', error);
    return NextResponse.json({
      ok: false,
      error: "Something went wrong while generating your diet plan. Please try again.",
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, { status: 500 });
  }
}