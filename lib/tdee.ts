export type Gender = "MALE" | "FEMALE" | "OTHER";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "VERY_ACTIVE"
  | "SUPER_ACTIVE";

export type FitnessGoal =
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "MAINTENANCE";

export interface DietInput {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  mealFrequency?: number;
}

const round = (n: number) => Math.round(n);

export function buildDietPlan(input: DietInput) {
  if (input.weightKg <= 0 || input.heightCm <= 0 || input.age <= 0) {
    throw new Error("weightKg, heightCm, and age must all be positive numbers");
  }
  if (input.mealFrequency !== undefined && input.mealFrequency <= 0) {
    throw new Error("mealFrequency must be a positive number");
  }

  const meals = input.mealFrequency ?? 4;

  // BMR
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;

  const bmr =
    input.gender === "MALE"
      ? base + 5
      : input.gender === "FEMALE"
      ? base - 161
      : base - 78;

  // Activity
  const factor: Record<ActivityLevel, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    VERY_ACTIVE: 1.725,
    SUPER_ACTIVE: 1.9,
  };

  const tdee = bmr * factor[input.activityLevel];

  // Goal adjustment. MAINTENANCE keeps a small deliberate band around TDEE
  // rather than a single exact number, consistent with the other goals.
  let minCalories = tdee - 100;
  let maxCalories = tdee + 100;

  if (input.goal === "WEIGHT_LOSS") {
    minCalories = tdee - 500;
    maxCalories = tdee - 300;
  }

  if (input.goal === "MUSCLE_GAIN") {
    minCalories = tdee + 250;
    maxCalories = tdee + 500;
  }

  // Protein & fat (weight-based)
  const proteinMin = round(1.6 * input.weightKg);
  const proteinMax = round(2.2 * input.weightKg);

  const fatMin = round(0.8 * input.weightKg);
  const fatMax = round(1.0 * input.weightKg);

  // Calories already allocated
  const proteinCaloriesMin = proteinMin * 4;
  const proteinCaloriesMax = proteinMax * 4;

  const fatCaloriesMin = fatMin * 9;
  const fatCaloriesMax = fatMax * 9;

  // Remaining calories → carbs (with safety floor)
  const carbsMin = Math.max(
    50,
    round((minCalories - proteinCaloriesMax - fatCaloriesMax) / 4)
  );

  const carbsMax = Math.max(
    carbsMin,
    round((maxCalories - proteinCaloriesMin - fatCaloriesMin) / 4)
  );

  return {
    totalCalories: {
      min: round(minCalories),
      max: round(maxCalories),
    },

    proteinG: {
      min: proteinMin,
      max: proteinMax,
    },

    fatG: {
      min: fatMin,
      max: fatMax,
    },

    carbsG: {
      min: carbsMin,
      max: carbsMax,
    },

    perMeal: {
      calories: {
        min: round(minCalories / meals),
        max: round(maxCalories / meals),
      },
    },
  };
}
