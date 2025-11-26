// app/api/generate-workout/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildWorkoutPlan } from '@/lib/workout';
import { WorkoutRequestSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth'; 
// 👆 NEW: to get current session/user

export async function POST(request: Request) {
  try {
    // 1) Get current session (logged-in user) on the server.
    const session = await auth();

    // 2) If not logged in, block access with 401.
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 3) Extract numeric userId.
    const userId = Number((session.user as any).id);

    // 4) Parse request body from JSON.
    const body = await request.json();

    // 5) Validate body against our Zod schema.
    const parsed = WorkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid workout payload',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    // IMPORTANT:
    // We ignore any payload.userId and instead use userId from session.

    // 6) Build the workout plan using our pure logic.
    const workoutPlan = buildWorkoutPlan({
      goal: payload.goal,
      fitnessLevel: payload.fitnessLevel,
      daysPerWeek: payload.daysPerWeek,
      location: payload.location,
      workoutTypes: payload.workoutTypes,
    });

    // 7) Save the questionnaire answers (WorkoutResponse).
    const workoutResponse = await prisma.workoutResponse.create({
      data: {
        userId,                         // 👈 from session
        gender: payload.gender,
        fitnessLevel: payload.fitnessLevel,
        goal: payload.goal,
        location: payload.location,
        workoutTypes: payload.workoutTypes,    // Json field
        workoutDays: String(payload.daysPerWeek),
      },
    });

    // 8) Save the workout plan snapshot into Plan table.
    const planRecord = await prisma.plan.create({
      data: {
        userId,                          // 👈 from session
        type: 'WORKOUT',
        title: `Workout plan — ${new Date().toISOString()}`,
        payload: workoutPlan,            // plan JSON
      },
    });

    // 9) Return plan and IDs to frontend.
    return NextResponse.json({
      ok: true,
      plan: workoutPlan,
      workoutResponseId: workoutResponse.id,
      planId: planRecord.id,
    });
  } catch (err) {
    console.error('generate-workout error', err);
    return NextResponse.json(
      { ok: false, error: 'Server error generating workout plan' },
      { status: 500 }
    );
  }
}
