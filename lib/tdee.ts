// lib/tdee.ts
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'VERY_ACTIVE'
  | 'SUPER_ACTIVE';
export type FitnessGoal = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'ENDURANCE';

export interface DietInput {
  age: number; // years
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  mealFrequency?: number; // default 4
}

export interface MacroRange {
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
}

export function calcBMR({ age, gender, weightKg, heightCm }: DietInput): number {
  // Mifflin-St Jeor
  // Male: 10*weight + 6.25*height - 5*age + 5
  // Female: 10*weight + 6.25*height - 5*age -161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'MALE') return base + 5;
  if (gender === 'FEMALE') return base - 161;
  // For OTHER, use average of male/female constants ( (+5) + (-161) )/2 = -78
  return base - 78;
}

export function activityFactor(level: ActivityLevel): number {
  switch (level) {
    case 'SEDENTARY':
      return 1.2;
    case 'LIGHT':
      return 1.375;
    case 'MODERATE':
      return 1.55;
    case 'VERY_ACTIVE':
      return 1.725;
    case 'SUPER_ACTIVE':
      return 1.9;
    default:
      return 1.55;
  }
}

export function calcTDEE(bmr: number, level: ActivityLevel): number {
  return bmr * activityFactor(level);
}

export function adjustCaloriesForGoal(tdee: number, goal: FitnessGoal): { min: number; max: number } {
  switch (goal) {
    case 'WEIGHT_LOSS':
      // TDEE - 300 .. TDEE - 500
      return { min: roundToTwo(tdee - 500), max: roundToTwo(tdee - 300) };
    case 'MUSCLE_GAIN':
      // TDEE + 250 .. TDEE + 500
      return { min: roundToTwo(tdee + 250), max: roundToTwo(tdee + 500) };
    case 'MAINTENANCE':
    case 'ENDURANCE':
    default:
      return { min: roundToTwo(tdee), max: roundToTwo(tdee) };
  }
}

function roundToTwo(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate macro ranges (protein, fat, carbs) based on weight and calorie range.
 * Protein: 1.6 - 2.2 g/kg
 * Fat: 0.8 - 1 g/kg
 * Carbs: remaining calories
 */
export function calcMacroRange(weightKg: number, caloriesRange: { min: number; max: number }) {
  const proteinMinG = roundToTwo(1.6 * weightKg);
  const proteinMaxG = roundToTwo(2.2 * weightKg);

  const fatMinG = roundToTwo(0.8 * weightKg);
  const fatMaxG = roundToTwo(1.0 * weightKg);

  // kCal per gram
  const kcalPerProtein = 4;
  const kcalPerFat = 9;
  const kcalPerCarb = 4;

  // For min-calorie scenario, assume higher protein & fat (conservative) OR compute both extremes.
  // We'll compute carbs as remaining calories after protein and fat.
  const carbsMinScenario = (() => {
    const proteinKcal = proteinMinG * kcalPerProtein; // using min protein → leaves more calories for carbs
    const fatKcal = fatMinG * kcalPerFat;
    const carbsKcal = caloriesRange.min - (proteinKcal + fatKcal);
    const carbsG = Math.max(0, roundToTwo(carbsKcal / kcalPerCarb));
    return carbsG;
  })();

  const carbsMaxScenario = (() => {
    const proteinKcal = proteinMaxG * kcalPerProtein; // higher protein consumes more calories → fewer carbs
    const fatKcal = fatMaxG * kcalPerFat;
    const carbsKcal = caloriesRange.max - (proteinKcal + fatKcal);
    const carbsG = Math.max(0, roundToTwo(carbsKcal / kcalPerCarb));
    return carbsG;
  })();

  // We'll return ranges for protein and fat, and carbs as min..max computed across calorie extremes.
  const carbsMinG = Math.min(carbsMinScenario, carbsMaxScenario);
  const carbsMaxG = Math.max(carbsMinScenario, carbsMaxScenario);

  return {
    proteinG: { min: proteinMinG, max: proteinMaxG },
    fatG: { min: fatMinG, max: fatMaxG },
    carbsG: { min: carbsMinG, max: carbsMaxG },
  };
}

export function buildDietPlan(input: DietInput): MacroRange {
  const mealFreq = input.mealFrequency ?? 4;

  const bmr = roundToTwo(calcBMR(input));
  const tdee = roundToTwo(calcTDEE(bmr, input.activityLevel));
  const calRange = adjustCaloriesForGoal(tdee, input.goal);

  const macros = calcMacroRange(input.weightKg, calRange);

  // per-meal
  const perMeal = {
    calories: {
      min: roundToTwo(calRange.min / mealFreq),
      max: roundToTwo(calRange.max / mealFreq),
    },
    proteinG: {
      min: roundToTwo(macros.proteinG.min / mealFreq),
      max: roundToTwo(macros.proteinG.max / mealFreq),
    },
    fatG: {
      min: roundToTwo(macros.fatG.min / mealFreq),
      max: roundToTwo(macros.fatG.max / mealFreq),
    },
    carbsG: {
      min: roundToTwo(macros.carbsG.min / mealFreq),
      max: roundToTwo(macros.carbsG.max / mealFreq),
    },
  };

  return {
    proteinG: macros.proteinG,
    fatG: macros.fatG,
    carbsG: { min: macros.carbsG.min, max: macros.carbsG.max },
    totalCalories: { min: calRange.min, max: calRange.max },
    perMeal,
  };
}
