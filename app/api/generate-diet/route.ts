// app/api/generate-diet/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DietRequestSchema } from "@/lib/schemas";
import { MealType, GoalType, DietType } from "@prisma/client";
import { buildDietPlan } from "@/lib/tdee";

// Configuration
const MAX_PORTION_WEIGHT = 600; // Maximum total weight per meal in grams
const MAX_INGREDIENT_LIMITS: Record<string, number> = {
  // Grains & Cereals
  'rice': 150, 'dal': 120, 'wheat': 100, 'dalia': 100, 'oats': 100,
  'quinoa': 100, 'pasta': 120, 'noodles': 120, 'bread': 4, // slices
  'roti': 3, 'chapati': 3, 'paratha': 2,
  
  // Proteins (vegetarian)
  'paneer': 150, 'tofu': 150, 'soya': 100, 'chickpea': 150,
  'sprout': 200, 'chana': 100, 'lentil': 120, 'bean': 150,
  'curd': 200, 'yogurt': 200, 'milk': 300,
  
  // Proteins (non-veg)
  'chicken': 200, 'fish': 180, 'prawn': 150, 'egg': 3, // count
  'mutton': 150, 'beef': 150, 'turkey': 180,
  
  // Vegetables
  'vegetable': 200, 'potato': 150, 'sweet potato': 150,
  'broccoli': 200, 'spinach': 150, 'carrot': 150,
  'cauliflower': 200, 'pea': 100, 'corn': 100,
  
  // Fruits
  'banana': 2, 'apple': 2, 'orange': 2, 'mango': 1,
  'grape': 150, 'berry': 150, 'papaya': 200,
  
  // Nuts & Seeds
  'nut': 50, 'almond': 30, 'walnut': 30, 'peanut': 40,
  'seed': 30, 'flax': 20, 'chia': 20,
  
  // Fats & Oils
  'oil': 4, // tsp max
  'ghee': 2, 'butter': 2, 'cream': 2,
};

// Helper to calculate meal targets based on daily targets and meal count
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

// Smart meal scaling with portion control
function scaleMealSensibly(meal: any, targetCalories: number) {
  // Calculate initial scale based on calorie target
  let scale = targetCalories / meal.calories;
  
  // Limit scaling range
  scale = Math.max(0.5, Math.min(1.8, scale));
  
  // Parse original ingredients
  const ingredients = meal.ingredients.split(';').map((ing: string) => {
    const trimmed = ing.trim();
    
    // Try to extract amount and unit
    const match = trimmed.match(/^([^0-9]+?)\s*(\d+(\.\d+)?)\s*([a-zA-Z]*)$/);
    if (!match) return { name: trimmed, amount: 0, unit: '' };
    
    const [, name, amount, , unit] = match;
    return {
      name: name.trim(),
      amount: parseFloat(amount),
      unit: unit.toLowerCase()
    };
  });
  
  // Calculate original total weight (in grams)
  const originalWeight = ingredients.reduce((sum: number, ing: any) => {
    if (ing.unit === 'g' || ing.unit === 'gram' || ing.unit === 'grams' || !ing.unit) {
      return sum + ing.amount;
    } else if (ing.unit === 'kg') {
      return sum + (ing.amount * 1000);
    } else {
      // For tsp, cups, etc., estimate weight
      return sum + (ing.amount * 5); // rough estimate
    }
  }, 0);
  
  // Adjust scale if portion would be too large
  const scaledWeight = originalWeight * scale;
  if (scaledWeight > MAX_PORTION_WEIGHT) {
    scale = MAX_PORTION_WEIGHT / originalWeight;
    scale = Math.max(0.5, scale); // Don't go below 0.5
  }
  
  // Scale each ingredient with individual limits
  const scaledIngredients = ingredients.map((ing: any) => {
    let scaledAmount = ing.amount * scale;
    
    // Apply ingredient-specific limits
    const ingName = ing.name.toLowerCase();
    for (const [key, limit] of Object.entries(MAX_INGREDIENT_LIMITS)) {
      if (ingName.includes(key)) {
        // Handle countable items (eggs, slices, etc.)
        if (['egg', 'bread', 'roti', 'chapati', 'paratha'].includes(key)) {
          scaledAmount = Math.min(Math.round(scaledAmount), limit);
        } else {
          scaledAmount = Math.min(scaledAmount, limit);
        }
        break;
      }
    }
    
    // Round appropriately
    if (ing.unit === 'tsp' || ing.unit === 'tbsp' || ing.unit === 'cup') {
      scaledAmount = Math.round(scaledAmount * 10) / 10; // 1 decimal
    } else if (!ing.unit || ing.unit === 'g') {
      scaledAmount = Math.round(scaledAmount);
    } else if (['egg', 'slice'].includes(ing.unit)) {
      scaledAmount = Math.round(scaledAmount);
    }
    
    return `${ing.name} ${scaledAmount}${ing.unit ? ing.unit : 'g'}`;
  }).join('; ');
  
  // Calculate scaled nutrition
  const scaledCalories = Math.round(meal.calories * scale);
  const scaledProtein = Math.round(meal.proteinG * scale);
  const scaledCarbs = Math.round(meal.carbsG * scale);
  const scaledFat = Math.round(meal.fatG * scale);
  
  return {
    ...meal,
    scale,
    calories: scaledCalories,
    proteinG: scaledProtein,
    carbsG: scaledCarbs,
    fatG: scaledFat,
    ingredients: scaledIngredients,
  };
}

// Get available meals with sensible filtering
async function getAvailableMeals(
  mealType: MealType,
  goal: GoalType,
  dietType: DietType,
  targetCalories: number
) {
  try {
    const calorieBuffer = 0.25; // Wider buffer for more options
    const minCalories = Math.round(targetCalories * (1 - calorieBuffer));
    const maxCalories = Math.round(targetCalories * (1 + calorieBuffer));
    
    // Also filter out extremely small meals
    const absoluteMinCalories = Math.max(100, minCalories * 0.6);
    
    console.log(`Fetching ${mealType} meals:`, { 
      target: targetCalories, 
      min: minCalories, 
      max: maxCalories,
      absoluteMin: absoluteMinCalories
    });

    const meals = await prisma.meal.findMany({
      where: {
        mealType,
        goal,
        dietType,
        isPublished: true,
        calories: {
          gte: absoluteMinCalories,
          lte: maxCalories
        }
      },
      take: 200, // Get more options
    });
    
    // Filter out meals that would require extreme scaling
    const sensibleMeals = meals.filter(meal => {
      const requiredScale = targetCalories / meal.calories;
      return requiredScale >= 0.5 && requiredScale <= 2.0;
    });
    
    console.log(`Found ${meals.length} meals, ${sensibleMeals.length} after sensible filtering for ${mealType}`);
    
    return sensibleMeals;
  } catch (error) {
    console.error(`Error fetching meals for ${mealType}:`, error);
    return [];
  }
}

// Generate diet with given meal count
async function generateDietWithMealCount(
  dailyTargets: any,
  goal: GoalType,
  dietType: DietType,
  mealCount: number
) {
  const mealTargets = calculateMealTargets(dailyTargets, mealCount);
  
  // Get available meals for each type
  const mealPools = {
    BREAKFAST: await getAvailableMeals(
      MealType.BREAKFAST, 
      goal, 
      dietType, 
      mealTargets.BREAKFAST.calories.avg
    ),
    LUNCH: await getAvailableMeals(
      MealType.LUNCH, 
      goal, 
      dietType, 
      mealTargets.LUNCH.calories.avg
    ),
    DINNER: await getAvailableMeals(
      MealType.DINNER, 
      goal, 
      dietType, 
      mealTargets.DINNER.calories.avg
    ),
    SNACK: await getAvailableMeals(
      MealType.SNACK, 
      goal, 
      dietType, 
      mealTargets[Object.keys(mealTargets).find(key => key.startsWith('SNACK')) || 'SNACK'].calories.avg
    ),
  };

  console.log('Available meals count:', {
    breakfast: mealPools.BREAKFAST.length,
    lunch: mealPools.LUNCH.length,
    dinner: mealPools.DINNER.length,
    snack: mealPools.SNACK.length
  });

  // Check if we have enough meals
  if (
    mealPools.BREAKFAST.length === 0 ||
    mealPools.LUNCH.length === 0 ||
    mealPools.DINNER.length === 0 ||
    mealPools.SNACK.length === 0
  ) {
    console.warn(`Insufficient meals for ${mealCount}-meal plan`);
    return null;
  }

  // Paneer tracker for vegetarian diets
  let paneerUsed = false;

  function canUsePaneer(meal: any) {
    if (dietType !== DietType.VEG) return true;
    if (!meal.ingredients.toLowerCase().includes("paneer")) return true;
    return !paneerUsed;
  }

  // Try to find good combination
  let bestCombination: any = null;
  let bestScore = Infinity;
  const maxAttempts = 1000;

  const slots = mealCount === 4 
    ? ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
    : mealCount === 5 
      ? ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK1', 'SNACK2']
      : ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK1', 'SNACK2', 'SNACK3'];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selectedMeals: Record<string, any> = {};
    const usedSnackIds = new Set<number>();
    const usedSnackTitles = new Set<string>();
    
    paneerUsed = false;

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
      let available = pool.filter(meal => {
        if (!canUsePaneer(meal)) return false;
        if (slot.startsWith('SNACK')) {
          return !usedSnackIds.has(meal.id) && !usedSnackTitles.has(meal.title);
        }
        return true;
      });

      // If no paneer meals available, relax paneer restriction
      if (available.length === 0 && dietType === DietType.VEG) {
        available = pool.filter(meal => {
          if (slot.startsWith('SNACK')) {
            return !usedSnackIds.has(meal.id) && !usedSnackTitles.has(meal.title);
          }
          return true;
        });
      }

      if (available.length === 0) {
        valid = false;
        break;
      }

      // Score and select meal
      const scoredMeals = available.map(meal => {
        const calorieDiff = Math.abs(meal.calories - target.calories.avg);
        const proteinDiff = Math.abs(meal.proteinG - target.protein.avg);
        const carbsDiff = Math.abs(meal.carbsG - target.carbs.avg);
        
        // Penalize meals that require extreme scaling
        const requiredScale = target.calories.avg / meal.calories;
        const scalePenalty = Math.abs(requiredScale - 1) * 100;
        
        const score = calorieDiff + proteinDiff + carbsDiff + scalePenalty;
        return { meal, score };
      });

      scoredMeals.sort((a, b) => a.score - b.score);

      // Pick from top 3 best matches
      const topN = Math.min(3, scoredMeals.length);
      const randomIndex = Math.floor(Math.random() * topN);
      const selectedMeal = scoredMeals[randomIndex].meal;

      // Scale meal sensibly
      const scaledMeal = scaleMealSensibly(selectedMeal, target.calories.avg);
      selectedMeals[slot] = scaledMeal;

      // Update totals
      totalCalories += scaledMeal.calories;
      totalProtein += scaledMeal.proteinG;
      totalCarbs += scaledMeal.carbsG;
      totalFat += scaledMeal.fatG;

      // Track paneer usage
      if (dietType === DietType.VEG && scaledMeal.ingredients.toLowerCase().includes("paneer")) {
        paneerUsed = true;
      }

      // Track snack usage
      if (slot.startsWith('SNACK')) {
        usedSnackIds.add(selectedMeal.id);
        usedSnackTitles.add(selectedMeal.title);
      }
    }

    if (!valid) continue;

    // Calculate how well this combination matches targets
    const calorieDiff = Math.abs(totalCalories - dailyTargets.calories.avg);
    const proteinDiff = Math.abs(totalProtein - dailyTargets.protein.avg);
    const carbsDiff = Math.abs(totalCarbs - dailyTargets.carbs.avg);
    const fatDiff = Math.abs(totalFat - dailyTargets.fat.avg);
    
    const totalScore = 
      (calorieDiff * 2) + // Most important
      (proteinDiff * 1.5) + // Very important
      (carbsDiff * 0.5) + 
      (fatDiff * 0.3);

    if (totalScore < bestScore) {
      bestScore = totalScore;
      bestCombination = {
        meals: selectedMeals,
        totals: { 
          calories: totalCalories, 
          protein: totalProtein, 
          carbs: totalCarbs, 
          fat: totalFat 
        }
      };

      // Good enough, break early
      if (totalScore < 150 && attempt > 50) break;
    }
  }

  if (!bestCombination) {
    console.warn(`Could not find optimal combination for ${mealCount} meals`);
    
    // Fallback: simplest combination
    const fallbackMeals: Record<string, any> = {};
    const fallbackTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
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
      
      if (pool.length > 0) {
        const meal = pool[0];
        const scaledMeal = scaleMealSensibly(meal, target.calories.avg);
        fallbackMeals[slot] = scaledMeal;
        
        fallbackTotals.calories += scaledMeal.calories;
        fallbackTotals.protein += scaledMeal.proteinG;
        fallbackTotals.carbs += scaledMeal.carbsG;
        fallbackTotals.fat += scaledMeal.fatG;
      }
    }
    
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

    console.log('Daily Targets:', dailyTargets);

    // Determine meal count based on calories
    let mealCount = dailyTargets.calories.avg < 2000 ? 4 : 6;
    
    // Try different meal counts if needed
    let dietResult = null;
    for (const count of [mealCount, 5, 4, 3].filter(c => c >= 3 && c <= 6)) {
      console.log(`Trying ${count} meals...`);
      dietResult = await generateDietWithMealCount(dailyTargets, goal, dietType, count);
      if (dietResult) {
        mealCount = count;
        break;
      }
    }

    if (!dietResult) {
      return NextResponse.json({
        ok: false,
        error: "Unable to generate diet plan with available meals. Please try different preferences."
      }, { status: 500 });
    }

    console.log(`Successfully generated ${mealCount}-meal plan`);
    console.log('Selected meals totals:', dietResult.totals);
    console.log('Daily targets:', dailyTargets);

    // Prepare response
    const response: any = {
      ok: true,
      plan,
      meals: dietResult.meals,
      planId: Date.now(),
      totals: dietResult.totals,
      mealCount,
    };

    // Add helpful notes
    if (dailyTargets.calories.avg > 3000) {
      response.note = "Portions are scaled for your high calorie needs. Consider splitting large meals if needed.";
    } else if (dailyTargets.calories.avg < 1500) {
      response.note = "These portions are designed for your calorie target. Listen to your hunger cues.";
    }

    if (dietType === DietType.VEG) {
      response.dietNote = "Vegetarian plan includes diverse protein sources.";
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating diet plan:', error);
    return NextResponse.json({ 
      ok: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}