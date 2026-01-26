// app/api/generate-diet/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DietRequestSchema } from "@/lib/schemas";
import { MealType, GoalType, DietType } from "@prisma/client";
import { buildDietPlan } from "@/lib/tdee";

// Configuration
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

// Find calorie bracket
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

// Calculate meal targets based on daily targets and meal count
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

// Get available meals from the correct calorie bracket
async function getAvailableMeals(
  mealType: MealType,
  goal: GoalType,
  dietType: DietType,
  dailyCalories: number,
  targetCalories: number
) {
  try {
    // Find the correct calorie bracket
    const { bracketMin, bracketMax } = findCalorieBracket(dailyCalories);
  
    console.log(`Fetching ${mealType} meals:`, {
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
  
    console.log(`Found ${meals.length} ${mealType} meals for ${dietType} ${goal}`);
  
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

// Simple scaling without extreme filtering
function scaleMeal(meal: any, targetCalories: number) {
  // Calculate scale factor
  let scale = targetCalories / meal.calories;
  // Allow reasonable scaling (0.3 to 3.0)
  scale = Math.max(0.3, Math.min(3.0, scale));
  // For non-veg, be more generous with scaling
  if (meal.dietType === DietType.NON_VEG) {
    scale = Math.max(0.5, Math.min(2.5, scale));
  }
  // Parse and scale ingredients
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
  
    // Apply ingredient limits
    for (const [key, limit] of Object.entries(MAX_INGREDIENT_LIMITS)) {
      if (ingName.includes(key)) {
        if (['egg', 'bread', 'roti', 'chapati', 'paratha'].includes(key)) {
          scaledAmount = Math.min(Math.round(scaledAmount), limit);
        } else {
          scaledAmount = Math.min(scaledAmount, limit);
        }
        break;
      }
    }
  
    // Round appropriately
    if (unit === 'tsp' || unit === 'tbsp') {
      scaledAmount = Math.round(scaledAmount * 10) / 10;
    } else {
      scaledAmount = Math.round(scaledAmount);
    }
  
    // Reassemble with trimmed name/unit
    return `${name.trim()} ${scaledAmount}${unit}`;
  }).join('; ');
  // Calculate scaled nutrition
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

// Generate diet with meal count
async function generateDietWithMealCount(
  dailyTargets: any,
  goal: GoalType,
  dietType: DietType,
  mealCount: number
) {
  const dailyCalories = dailyTargets.calories.avg;
  const mealTargets = calculateMealTargets(dailyTargets, mealCount);
  console.log('\n=== Generating Diet Plan ===');
  console.log('Daily calories:', dailyCalories);
  console.log('Goal:', goal);
  console.log('Diet type:', dietType);
  console.log('Meal count:', mealCount);
  console.log('Meal targets:', mealTargets);
  // Get all available meals
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
  console.log('\n=== Available Meals ===');
  console.log('Breakfast:', mealPools.BREAKFAST.length);
  console.log('Lunch:', mealPools.LUNCH.length);
  console.log('Dinner:', mealPools.DINNER.length);
  console.log('Snack:', mealPools.SNACK.length);
  // Check if we have enough meals
  if (
    mealPools.BREAKFAST.length === 0 ||
    mealPools.LUNCH.length === 0 ||
    mealPools.DINNER.length === 0 ||
    mealPools.SNACK.length === 0
  ) {
    console.error('Not enough meals available');
    return null;
  }
  // Define meal slots based on count
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
    console.error('Could not find any combination');
    return null;
  }
  console.log('\n=== Selected Meals ===');
  for (const slot of slots) {
    const meal = bestCombination.meals[slot];
    console.log(`${slot}: ${meal.title} (${meal.calories} cal, ${meal.proteinG}g protein)`);
  }
  console.log('Total:', bestCombination.totals);
  return bestCombination;
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = DietRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input data"
      }, { status: 400 });
    }
    const payload = parsed.data;
    // Build diet plan
    const plan = buildDietPlan(payload);
    const goal: GoalType = payload.goal === "ENDURANCE" ? GoalType.MAINTENANCE : payload.goal;
    const dietType: DietType = payload.dietPreference === "NON_VEG" ? DietType.NON_VEG : DietType.VEG;
    // Calculate daily targets
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
    console.log('\n=== User Input ===');
    console.log('Age:', payload.age);
    console.log('Gender:', payload.gender);
    console.log('Weight:', payload.weightKg, 'kg');
    console.log('Height:', payload.heightCm, 'cm');
    console.log('Activity:', payload.activityLevel);
    console.log('Goal:', goal);
    console.log('Diet type:', dietType);
    console.log('Daily calories:', dailyTargets.calories.avg);
    // Try different meal counts
    let mealCount = dailyTargets.calories.avg < 2000 ? 4 : 6;
    let dietResult = null;
  
    // Try in order: preferred, then alternatives
    const mealCountsToTry = [mealCount, 5, 4, 3].filter(c => c >= 3 && c <= 6);
  
    for (const count of mealCountsToTry) {
      console.log(`\nTrying ${count} meals...`);
      dietResult = await generateDietWithMealCount(dailyTargets, goal, dietType, count);
      if (dietResult) {
        mealCount = count;
        break;
      }
    }
    if (!dietResult) {
      return NextResponse.json({
        ok: false,
        error: "Unable to generate diet plan. Please try different preferences.",
        debug: {
          dailyCalories: dailyTargets.calories.avg,
          goal: goal,
          dietType: dietType,
          bracket: findCalorieBracket(dailyTargets.calories.avg)
        }
      }, { status: 500 });
    }
    // Prepare response
    const response: any = {
      ok: true,
      plan: {
        ...plan,
        dailyTargets: dailyTargets
      },
      meals: dietResult.meals,
      totals: dietResult.totals,
      mealCount: mealCount,
      planId: Date.now(),
    };
    // Add notes
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
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}