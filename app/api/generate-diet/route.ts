// app/api/generate-diet/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildDietPlan } from '@/lib/tdee';
import { DietRequestSchema } from '@/lib/schemas';
import { recommendMealsForPlan } from '@/lib/mealPlanner';
import { auth } from '@/lib/auth'; 
// 👆 NEW: import our auth() helper to read the current logged-in user.

export async function POST(request: Request) {
  try {
    // 1) Check who is making this request (which user is logged in).
    const session = await auth();

    // 2) If no session, user is not logged in → we can block or allow anonymous.
    //    For now we will BLOCK and return 401 (Unauthorized).
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 3) Extract userId from session (we stored it in callbacks in lib/auth.ts).
    const userId = Number((session.user as any).id);

    // 4) Read JSON body from request.
    const body = await request.json();

    // 5) Validate it against DietRequestSchema.
    const parse = DietRequestSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload', details: parse.error.format() },
        { status: 400 }
      );
    }

    const payload = parse.data;

    // IMPORTANT:
    // We IGNORE payload.userId even if it exists.
    // We only trust userId from session.

    // 6) Run server-side nutrition logic to build the plan.
    const plan = buildDietPlan({
      age: payload.age,
      gender: payload.gender,
      weightKg: payload.weightKg,
      heightCm: payload.heightCm,
      activityLevel: payload.activityLevel,
      goal: payload.goal,
      mealFrequency: payload.mealFrequency,
    });

    // 7) Save DietResponse (the questionnaire answers).
    const dietResponse = await prisma.dietResponse.create({
      data: {
        userId, // 👈 use userId from session
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

    // 8) Generate meal suggestions using our meal planner.
    const mealSuggestions = await recommendMealsForPlan(
      plan,
      payload.mealFrequency ?? 4,
      payload.dietPreference ?? null,
      payload.foodRestrictions ?? null
    );

    // 9) Save plan snapshot, including the meal suggestions.
    const planRecord = await prisma.plan.create({
      data: {
        userId, // 👈 again, use session user
        type: 'DIET',
        title: `Diet plan — ${new Date().toISOString()}`,
        payload: { plan, mealSuggestions },
      },
    });

    // 10) Return everything back to the client.
    return NextResponse.json({
      ok: true,
      plan,
      mealSuggestions,
      dietResponseId: dietResponse.id,
      planId: planRecord.id,
    });
  } catch (err) {
    console.error('generate-diet error', err);
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
