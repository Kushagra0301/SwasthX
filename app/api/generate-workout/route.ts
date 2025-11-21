import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildWorkoutPlan } from "@/lib/workout";
import { WorkoutRequestSchema  } from "@/lib/schemas";

export async function POST (request: Request){
    try
    {
        const body = await request.json();

        const parsed = WorkoutRequestSchema .safeParse(body);
        
        if(!parsed.success){
            return NextResponse.json(
                {
                    ok: false,
                    error: 'Invalid workout payload',
                    details: parsed.error.format(),
                },
                {status: 400}
            );
        }

        const payload = parsed.data;

        const workoutPlan = buildWorkoutPlan({
            goal: payload.goal,
            fitnessLevel: payload.fitnessLevel,
            daysPerWeek: payload.daysPerWeek,
            location: payload.location,
            workoutTypes: payload.workoutTypes,
        });

        // Save the user's answers (workout questionnaire) into the WorkoutResponse table.
        const workoutResponse = await prisma.workoutResponse.create({
            data:{
                userId: payload.userId ?? undefined,
                gender: payload.gender,
                fitnessLevel: payload.fitnessLevel,
                goal:payload.goal,
                location: payload.location,              
                workoutTypes: payload.workoutTypes,       
                workoutDays: String(payload.daysPerWeek),                  
            },
        });

        // Save the full workout plan snapshot into the Plan table.

        const planRecord = await prisma.plan.create({
            data:{
                userId:payload.userId ?? undefined,
                type: 'WORKOUT',
                title: 'Workout plan - ${new Date().toISOString()}',
                payload: JSON.parse(JSON.stringify(workoutPlan)),
            },
        });

        return NextResponse.json({
            ok:true,
            plan: workoutPlan,
            workoutResponseId: workoutResponse.id,
            planRecord: planRecord.id,
        });
    }
    catch(err){
        console.error('Generate Workout Error',err);
        return NextResponse.json(
        { ok: false, error: 'Server error generating workout plan' },
        { status: 500 }
        );
    }
}