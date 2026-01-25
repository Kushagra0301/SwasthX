// app/api/generate-workout/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WorkoutRequestSchema } from "@/lib/schemas";
import {
  WorkoutType,
  GoalType,
  FitnessLevel,
  WorkoutLocation,
} from "@prisma/client";

/* ---------------------------------
   Helper: normalize goal
----------------------------------*/
function normalizeGoal(goal: string): GoalType {
  return goal === "ENDURANCE" ? GoalType.MAINTENANCE : (goal as GoalType);
}

/* ---------------------------------
   Helper: map workout types for database query
----------------------------------*/
function mapWorkoutTypesForDB(workoutTypes: string[]): WorkoutType[] {
  const mappedTypes: WorkoutType[] = [];
  
  workoutTypes.forEach(type => {
    if (type === "STRENGTH") {
      mappedTypes.push(WorkoutType.STRENGTH, WorkoutType.BODYWEIGHT);
    } else {
      mappedTypes.push(type as WorkoutType);
    }
  });
  
  return mappedTypes;
}

/* ---------------------------------
   Helper: create workout split based on days per week
----------------------------------*/
function createWorkoutSplit(daysPerWeek: number) {
  switch (daysPerWeek) {
    case 1:
      return [{ focus: "Full Body", muscleGroups: ["CHEST", "BACK", "LEGS", "SHOULDERS", "ARMS"] }];
    
    case 2:
      return [
        { focus: "Upper Body", muscleGroups: ["CHEST", "BACK", "SHOULDERS", "ARMS"] },
        { focus: "Lower Body", muscleGroups: ["LEGS", "CORE"] }
      ];
    
    case 3:
      return [
        { focus: "Push (Chest/Shoulders/Triceps)", muscleGroups: ["CHEST", "SHOULDERS", "ARMS"] },
        { focus: "Pull (Back/Biceps)", muscleGroups: ["BACK", "ARMS"] },
        { focus: "Legs & Core", muscleGroups: ["LEGS", "CORE"] }
      ];
    
    case 4:
      return [
        { focus: "Chest & Triceps", muscleGroups: ["CHEST", "ARMS"] },
        { focus: "Back & Biceps", muscleGroups: ["BACK", "ARMS"] },
        { focus: "Legs", muscleGroups: ["LEGS"] },
        { focus: "Shoulders & Core", muscleGroups: ["SHOULDERS", "CORE"] }
      ];
    
    case 5:
      return [
        { focus: "Chest", muscleGroups: ["CHEST"] },
        { focus: "Back", muscleGroups: ["BACK"] },
        { focus: "Legs", muscleGroups: ["LEGS"] },
        { focus: "Shoulders", muscleGroups: ["SHOULDERS"] },
        { focus: "Arms & Core", muscleGroups: ["ARMS", "CORE"] }
      ];
    
    case 6:
      return [
        { focus: "Chest & Triceps", muscleGroups: ["CHEST", "ARMS"] },
        { focus: "Back & Biceps", muscleGroups: ["BACK", "ARMS"] },
        { focus: "Legs", muscleGroups: ["LEGS"] },
        { focus: "Shoulders", muscleGroups: ["SHOULDERS"] },
        { focus: "Full Body", muscleGroups: ["CHEST", "BACK", "LEGS", "SHOULDERS", "ARMS"] },
        { focus: "Cardio & Core", muscleGroups: ["CORE", "FULL_BODY"] }
      ];
    
    default:
      const baseSplit = [
        { focus: "Chest & Triceps", muscleGroups: ["CHEST", "ARMS"] },
        { focus: "Back & Biceps", muscleGroups: ["BACK", "ARMS"] },
        { focus: "Legs", muscleGroups: ["LEGS"] },
        { focus: "Shoulders & Core", muscleGroups: ["SHOULDERS", "CORE"] },
        { focus: "Full Body", muscleGroups: ["CHEST", "BACK", "LEGS", "SHOULDERS", "ARMS"] },
        { focus: "Cardio & HIIT", muscleGroups: ["FULL_BODY", "CORE"] },
        { focus: "Active Recovery / Rest", muscleGroups: [] }
      ];
      return baseSplit.slice(0, daysPerWeek);
  }
}

/* ---------------------------------
   Helper: get exercises for muscle groups
----------------------------------*/
function getExercisesForMuscleGroups(
  blocks: any[], 
  muscleGroups: string[], 
  count: number = 4,
  excludeIds: Set<number> = new Set()
) {
  const available = blocks.filter(block => 
    muscleGroups.includes(block.muscleGroup) && 
    !excludeIds.has(block.id)
  );
  
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/* ---------------------------------
   Type definitions
----------------------------------*/
type ExerciseItem = {
  name: string;
  muscleGroup: string;
  sets: string;
  repsOrTime: string;
  equipment: string;
  notes?: string;
};

type WorkoutDay = {
  dayLabel: string;
  focus: string;
  warmup: string[];
  exercises: ExerciseItem[];
  cooldown: string[];
};

/* ---------------------------------
   Helper: build one day with specific focus
----------------------------------*/
function buildDay(dayIndex: number, split: any, blocks: any[], usedExerciseIds: Set<number>): WorkoutDay {
  const exercises: ExerciseItem[] = [];
  
  if (split.muscleGroups.length > 0) {
    const dayExercises = getExercisesForMuscleGroups(
      blocks, 
      split.muscleGroups, 
      4,
      usedExerciseIds
    );
    
    dayExercises.forEach(ex => {
      exercises.push({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        repsOrTime: ex.repsOrTime,
        equipment: ex.equipment,
        notes: ex.notes ?? undefined,
      });
      usedExerciseIds.add(ex.id);
    });
  }
  
  if (split.focus.toLowerCase().includes("cardio") || split.focus.toLowerCase().includes("hiit")) {
    const cardioExercises = blocks
      .filter(block => 
        block.muscleGroup === "FULL_BODY" && 
        (block.workoutType === "CARDIO" || block.workoutType === "HIIT")
      )
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
    
    cardioExercises.forEach(ex => {
      exercises.push({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        repsOrTime: ex.repsOrTime,
        equipment: ex.equipment,
        notes: ex.notes ?? undefined,
      });
      usedExerciseIds.add(ex.id);
    });
  }
  
  if (exercises.length < 3 && split.muscleGroups.length > 0) {
    const extraExercises = blocks
      .filter(block => !usedExerciseIds.has(block.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3 - exercises.length);
    
    extraExercises.forEach(ex => {
      exercises.push({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        repsOrTime: ex.repsOrTime,
        equipment: ex.equipment,
        notes: ex.notes ?? undefined,
      });
      usedExerciseIds.add(ex.id);
    });
  }
  
  return {
    dayLabel: `Day ${dayIndex + 1}`,
    focus: split.focus,
    warmup: [
      "5 min light cardio (jogging, jumping jacks, or dynamic movements)",
      "Dynamic stretches (leg swings, arm circles, torso twists)",
      "Activation exercises (glute bridges, band pull-aparts)"
    ],
    exercises,
    cooldown: [
      "5 min light cardio to lower heart rate",
      "Static stretching for worked muscle groups (hold each stretch 30 sec)",
      "Deep breathing and mobility work"
    ],
  };
}

/* ---------------------------------
   POST
----------------------------------*/
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = WorkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const workoutTypesForDB = mapWorkoutTypesForDB(payload.workoutTypes);

    const blocks = await prisma.exerciseBlock.findMany({
      where: {
        isPublished: true,
        goal: normalizeGoal(payload.goal),
        fitnessLevel: payload.fitnessLevel as FitnessLevel,
        location: payload.location as WorkoutLocation,
        workoutType: {
          in: workoutTypesForDB,
        },
      },
    });

    if (blocks.length === 0) {
      const fallbackBlocks = await prisma.exerciseBlock.findMany({
        where: {
          isPublished: true,
          goal: normalizeGoal(payload.goal),
          fitnessLevel: payload.fitnessLevel as FitnessLevel,
        },
        take: 50
      });

      if (fallbackBlocks.length === 0) {
        return NextResponse.json({
          ok: false,
          error: "No exercises found for selected filters"
        });
      }

      const split = createWorkoutSplit(payload.daysPerWeek);
      const days: WorkoutDay[] = [];
      const usedExerciseIds = new Set<number>();

      for (let i = 0; i < payload.daysPerWeek; i++) {
        const daySplit = split[i % split.length];
        const day = buildDay(i, daySplit, fallbackBlocks, usedExerciseIds);
        days.push(day);
      }

      return NextResponse.json({
        ok: true,
        planId: Date.now(),
        plan: {
          goal: payload.goal,
          fitnessLevel: payload.fitnessLevel,
          daysPerWeek: payload.daysPerWeek,
          location: payload.location,
          workoutTypes: payload.workoutTypes,
          days,
        },
      });
    }

    const split = createWorkoutSplit(payload.daysPerWeek);
    const days: WorkoutDay[] = [];
    const usedExerciseIds = new Set<number>();

    for (let i = 0; i < payload.daysPerWeek; i++) {
      const daySplit = split[i % split.length];
      const day = buildDay(i, daySplit, blocks, usedExerciseIds);
      days.push(day);
    }

    return NextResponse.json({
      ok: true,
      planId: Date.now(),
      plan: {
        goal: payload.goal,
        fitnessLevel: payload.fitnessLevel,
        daysPerWeek: payload.daysPerWeek,
        location: payload.location,
        workoutTypes: payload.workoutTypes,
        days,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}