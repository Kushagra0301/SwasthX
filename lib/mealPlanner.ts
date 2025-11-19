// lib/mealPlanner.ts
import prisma from './prisma';
import type { Prisma } from '@prisma/client';

type MealRow = {
  id: number;
  title: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  tags?: string | null;
  recipeUrl?: string | null;
  ingredients?: string | null;
};

export type MealSuggestion = {
  mealId: number;
  title: string;
  scale: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  tags?: string[];
  recipeUrl?: string | null;
};

// Based on the return type of buildDietPlan() from lib/tdee.ts
type DietPlan = {
  proteinG: { min: number; max: number };
  fatG: { min: number; max: number };
  carbsG: { min: number; max: number };
  totalCalories: { min: number; max: number };
  perMeal: {
    calories: { min: number; max: number };
    proteinG: { min: number; max: number };
    fatG: { min: number; max: number };
    carbsG: { min: number; max: number };
  };
};

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  try {
    if (typeof raw === 'string') return JSON.parse(raw);
    if (Array.isArray(raw)) return raw;
    return [];
  } catch {
    return [];
  }
}

function scoreMealAgainstTarget(
  meal: MealRow,
  targetCalories: number,
  targetProtein: number,
  targetFat: number,
  targetCarbs: number
): number {
  // Compute relative error for each nutrient
  const eps = 1e-6;
  const calErr = Math.abs(meal.calories - targetCalories) / (targetCalories + eps);
  const protErr = Math.abs(meal.proteinG - targetProtein) / (targetProtein + eps);
  const fatErr = Math.abs(meal.fatG - targetFat) / (targetFat + eps);
  const carbErr = Math.abs(meal.carbsG - targetCarbs) / (targetCarbs + eps);

  // Weights: calories 0.45, protein 0.25, fat 0.15, carbs 0.15
  return 0.45 * calErr + 0.25 * protErr + 0.15 * fatErr + 0.15 * carbErr;
}

/**
 * Recommend meals for a plan.
 *
 * @param plan the result from buildDietPlan()
 * @param mealFrequency number of meals per day
 * @param dietPreference string like 'veg' | 'non-veg' etc. optional
 * @param foodRestrictions comma-separated or array of strings to exclude
 * @param maxCandidates maximum number of candidate meals to consider
 */
export async function recommendMealsForPlan(
  plan: DietPlan,
  mealFrequency: number,
  dietPreference?: string | null,
  foodRestrictions?: string | null,
  maxCandidates = 100
): Promise<MealSuggestion[]> {
  // Per-meal targets: use the average between min and max
  const perMealCalories = (plan.perMeal.calories.min + plan.perMeal.calories.max) / 2;
  const perMealProtein = (plan.perMeal.proteinG.min + plan.perMeal.proteinG.max) / 2;
  const perMealFat = (plan.perMeal.fatG.min + plan.perMeal.fatG.max) / 2;
  const perMealCarbs = (plan.perMeal.carbsG.min + plan.perMeal.carbsG.max) / 2;

  // Build Prisma where clause with proper typing
  const whereClause: Prisma.MealWhereInput = {};

  // Fetch meals from database
  const meals = (await prisma.meal.findMany({
    where: whereClause,
    take: maxCandidates,
  })) as MealRow[];

  // Filter by dietPreference & restrictions (client-side)
  const filtered = meals.filter((m) => {
    const tags = parseTags(m.tags);
    
    // Diet preference check
    if (dietPreference && tags.length > 0) {
    const prefLower = dietPreference.toLowerCase();
    const hasPref = tags.map((t) => t.toLowerCase()).includes(prefLower);
    if (!hasPref) return false;
    }  
    // Food restrictions exclusion
    if (foodRestrictions) {
      const restrictions =
        typeof foodRestrictions === 'string'
          ? foodRestrictions.split(',').map((s) => s.trim().toLowerCase())
          : [];
      
      for (const r of restrictions) {
        if (!r) continue;
        
        // Check tags
        if (tags.map((t) => t.toLowerCase()).includes(r)) return false;
        
        // Check ingredients text
        if (m.ingredients && m.ingredients.toLowerCase().includes(r)) return false;
      }
    }
    
    return true;
  });

  // For each meal slot, pick the best meal
  const suggestions: MealSuggestion[] = [];

  for (let slot = 0; slot < mealFrequency; slot++) {
    const calTarget = perMealCalories;
    const protTarget = perMealProtein;
    const fatTarget = perMealFat;
    const carbTarget = perMealCarbs;

    // Rank meals by score (lower is better)
    const scored = filtered
      .map((meal) => {
        // Compute scale factor to match calories
        const scale = meal.calories > 0 ? calTarget / meal.calories : 1;
        // Clamp scale to reasonable bounds [0.4, 2.0]
        const clampedScale = Math.max(0.4, Math.min(2.0, scale));
        
        const scaledMeal = {
          ...meal,
          calories: meal.calories * clampedScale,
          proteinG: meal.proteinG * clampedScale,
          fatG: meal.fatG * clampedScale,
          carbsG: meal.carbsG * clampedScale,
        };
        
        const score = scoreMealAgainstTarget(
          scaledMeal,
          calTarget,
          protTarget,
          fatTarget,
          carbTarget
        );
        
        return { meal, score, scale: clampedScale, scaledMeal };
      })
      .sort((a, b) => a.score - b.score);

    // Pick top candidate
    const top = scored[0];
    if (!top) break;

    suggestions.push({
      mealId: top.meal.id,
      title: top.meal.title,
      scale: roundToTwo(top.scale),
      calories: roundToTwo(top.scaledMeal.calories),
      proteinG: roundToTwo(top.scaledMeal.proteinG),
      fatG: roundToTwo(top.scaledMeal.fatG),
      carbsG: roundToTwo(top.scaledMeal.carbsG),
      tags: parseTags(top.meal.tags),
      recipeUrl: top.meal.recipeUrl ?? null,
    });
  }

  return suggestions;
}

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}
