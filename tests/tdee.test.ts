// tests/tdee.test.ts
import { buildDietPlan, calcBMR, calcTDEE } from '../lib/tdee';

describe('tdee / macros calculations', () => {
  test('BMR calculation for 30yo male 70kg 175cm', () => {
    const input = { age: 30, gender: 'MALE', weightKg: 70, heightCm: 175, activityLevel: 'MODERATE', goal: 'WEIGHT_LOSS' } as never;
    const bmr = calcBMR(input);
    // manual calc: 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
    expect(bmr).toBeCloseTo(1648.75, 2);
    const tdee = calcTDEE(bmr, 'MODERATE');
    // tdee = 1648.75 * 1.55 = 2555.5625
    expect(tdee).toBeCloseTo(2555.5625, 3);
  });

  test('buildDietPlan returns expected ranges and per-meal split', () => {
    const input = {
      age: 30,
      gender: 'MALE',
      weightKg: 70,
      heightCm: 175,
      activityLevel: 'MODERATE',
      goal: 'WEIGHT_LOSS',
      mealFrequency: 4,
    } as never;

    const plan = buildDietPlan(input);

    console.log("Plan output:", JSON.stringify(plan, null, 2));  // <--- ADD THIS

    // Total calories range should be TDEE - 500 to TDEE - 300
    // Previously we calculated TDEE ≈ 2555.5625 -> range ≈ 2055.56 .. 2255.56
    expect(plan.totalCalories.min).toBeCloseTo(2055.56, 2);
    expect(plan.totalCalories.max).toBeCloseTo(2255.56, 2);

    // Protein range: 1.6 - 2.2 g/kg => for 70kg = 112 .. 154 g
    expect(plan.proteinG.min).toBeCloseTo(112, 2);
    expect(plan.proteinG.max).toBeCloseTo(154, 2);

    // Fat range: 0.8 - 1.0 g/kg => 56 .. 70 g
    expect(plan.fatG.min).toBeCloseTo(56, 2);
    expect(plan.fatG.max).toBeCloseTo(70, 2);

    // Per-meal calories: divide total range by 4
    expect(plan.perMeal.calories.min).toBeCloseTo(plan.totalCalories.min / 4, 2);
    expect(plan.perMeal.calories.max).toBeCloseTo(plan.totalCalories.max / 4, 2);

    // Per-meal protein grams should be within per-meal splits
    expect(plan.perMeal.proteinG.min).toBeCloseTo(plan.proteinG.min / 4, 2);
    expect(plan.perMeal.proteinG.max).toBeCloseTo(plan.proteinG.max / 4, 2);
  });
});
