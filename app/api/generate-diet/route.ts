import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildDietPlan } from "@/lib/tdee";
import { DietRequestSchema } from "@/lib/schemas";
import { recommendMealsForPlan } from '../../../lib/mealPlanner';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = DietRequestSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parse.error.format() }, { status: 400 });
    }

    const payload = parse.data;

    // 1) Run the server-side nutrition logic
    const plan = buildDietPlan({
      age: payload.age,
      gender: payload.gender,
      weightKg: payload.weightKg,
      heightCm: payload.heightCm,
      activityLevel: payload.activityLevel,
      goal: payload.goal,
      mealFrequency: payload.mealFrequency,
    });

    // 2) Persist DietResponse
    const dietResponse = await prisma.dietResponse.create({
      data: {
        userId: payload.userId ?? undefined,
        age: payload.age,
        gender: payload.gender,
        currentWeightKg: payload.weightKg,
        heightCm: payload.heightCm,
        targetWeightKg: null,
        activityLevel: payload.activityLevel,
        goal: payload.goal,
        dietPreference: payload.dietPreference ?? '',
        mealFrequency: payload.mealFrequency ?? 4,
        foodRestrictions: payload.foodRestrictions ?? '',
      },
    });

    const mealSuggestions = await recommendMealsForPlan(plan, payload.mealFrequency ?? 4, payload.dietPreference ?? null, payload.foodRestrictions ?? null);

    // persist plan snapshot including suggestions
    const planRecord = await prisma.plan.create({
      data: {
        userId: payload.userId ?? undefined,
        type: 'DIET',
        title: `Diet plan — ${new Date().toISOString()}`,
        payload: { plan, mealSuggestions },
      },
    });

    // 4) Return plan + db ids
    return NextResponse.json({
      ok: true,
      plan,
      mealSuggestions,
      dietResponseId: dietResponse.id,
      planId: planRecord.id,
    });
  } catch (err) {
    console.error('generate-diet error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}