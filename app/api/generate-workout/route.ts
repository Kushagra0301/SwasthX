import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WorkoutRequestSchema } from "@/lib/schemas";
import {
  WorkoutType,
  GoalType,
  FitnessLevel,
  WorkoutLocation,
} from "@prisma/client";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const isDev = process.env.NODE_ENV !== "production";

// Fisher-Yates shuffle. Array.sort(() => 0.5 - Math.random()) is a common but
// statistically biased shortcut - it doesn't produce a uniform distribution.
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mapWorkoutTypesForDB(workoutTypes: string[]): WorkoutType[] {
  const mappedTypes: WorkoutType[] = [];

  workoutTypes.forEach(type => {
    if (type === "STRENGTH") {
      mappedTypes.push(WorkoutType.STRENGTH, WorkoutType.BODYWEIGHT);
    } else {
      mappedTypes.push(type as WorkoutType);
    }
  });

  return [...new Set(mappedTypes)];
}

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
        { focus: "Cardio & Core", muscleGroups: ["FULL_BODY", "CORE"] }
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

function determineCountForMg(mg: string): number {
  if (mg === "LEGS" || mg === "SHOULDERS") return 4;
  if (mg === "CHEST" || mg === "BACK") return 3;
  if (mg === "ARMS" || mg === "CORE") return 2;
  return 3;
}

function getExercisesForMuscleGroups(
  blocks: any[],
  muscleGroups: string[],
  focus: string,
  count: number,
  excludeIds: Set<number> = new Set()
) {
  let available = blocks.filter(block =>
    muscleGroups.includes(block.muscleGroup) &&
    !excludeIds.has(block.id)
  );

  if (muscleGroups.includes("ARMS")) {
    available = available.filter(block => {
      if (block.muscleGroup !== "ARMS") return true;

      const text = `${block.name} ${block.notes || ''}`.toLowerCase();
      const fLower = focus.toLowerCase();

      if (fLower.includes("triceps")) {
        const tricepsKeywords = [
          "tricep", "triceps", "diamond", "close-grip", "close", "grip",
          "extension", "pushdown", "skull", "jm", "plank up", "one-arm",
          "planche", "dip", "push up"
        ];
        return tricepsKeywords.some(kw => text.includes(kw));
      } else if (fLower.includes("biceps")) {
        const bicepsKeywords = [
          "bicep", "curl", "chin", "hammer", "preacher", "spider",
          "typewriter", "underhand", "isometric bicep"
        ];
        return bicepsKeywords.some(kw => text.includes(kw));
      } else {
        return true;
      }
    });
  }

  return shuffle(available).slice(0, Math.min(count, available.length));
}

type ExerciseItem = {
  name: string;
  muscleGroup: string;
  sets: number;
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
  sparse?: boolean;
};

function buildDay(dayIndex: number, split: any, blocks: any[], usedExerciseIds: Set<number>): WorkoutDay {
  let exercises: ExerciseItem[] = [];

  if (split.muscleGroups.length > 0) {
    for (const mg of split.muscleGroups) {
      const mgCount = determineCountForMg(mg);
      const mgExercises = getExercisesForMuscleGroups(
        blocks,
        [mg],
        split.focus,
        mgCount,
        usedExerciseIds
      );

      mgExercises.forEach(ex => {
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
  }

  const focusLower = split.focus.toLowerCase();
  if (focusLower.includes("cardio") || focusLower.includes("hiit")) {
    const cardioExercises = shuffle(
      blocks.filter(block =>
        block.muscleGroup === "FULL_BODY" &&
        (block.workoutType === "CARDIO" || block.workoutType === "HIIT") &&
        !usedExerciseIds.has(block.id)
      )
    ).slice(0, 3);

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

  const uniqueExercises: ExerciseItem[] = [];
  const seenNames = new Set<string>();
  for (const ex of exercises) {
    if (!seenNames.has(ex.name)) {
      uniqueExercises.push(ex);
      seenNames.add(ex.name);
    }
  }
  exercises = uniqueExercises;

  if (exercises.length < 3 && split.muscleGroups.length > 0) {
    const extraExercises = shuffle(
      blocks.filter(block => !usedExerciseIds.has(block.id))
    ).slice(0, 3 - exercises.length);

    extraExercises.forEach(ex => {
      if (!seenNames.has(ex.name)) {
        exercises.push({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: ex.sets,
          repsOrTime: ex.repsOrTime,
          equipment: ex.equipment,
          notes: ex.notes ?? undefined,
        });
        usedExerciseIds.add(ex.id);
        seenNames.add(ex.name);
      }
    });
  }

  const isRestDay = split.muscleGroups.length === 0;

  return {
    dayLabel: `Day ${dayIndex + 1}`,
    focus: split.focus,
    warmup: isRestDay ? [] : [
      "5 min light cardio (jogging, jumping jacks, or dynamic movements)",
      "Dynamic stretches (leg swings, arm circles, torso twists)",
      "Activation exercises (glute bridges, band pull-aparts)"
    ],
    exercises,
    cooldown: isRestDay ? [] : [
      "5 min light cardio to lower heart rate",
      "Static stretching for worked muscle groups (hold each stretch 30 sec)",
      "Deep breathing and mobility work"
    ],
    sparse: !isRestDay && exercises.length < 3,
  };
}

export async function POST(req: Request) {
  const { allowed, retryAfterSeconds } = rateLimit(getClientIp(req));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }
  try {
    const body = await req.json();
    const parsed = WorkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please check the highlighted fields and try again.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const goal = payload.goal as GoalType;
    const workoutTypesForDB = mapWorkoutTypesForDB(payload.workoutTypes);
    const bodyweightAutoIncluded =
      workoutTypesForDB.includes(WorkoutType.BODYWEIGHT) &&
      !payload.workoutTypes.includes("BODYWEIGHT");

    const blocks = await prisma.exerciseBlock.findMany({
      where: {
        isPublished: true,
        goal,
        fitnessLevel: payload.fitnessLevel as FitnessLevel,
        location: payload.location as WorkoutLocation,
        workoutType: {
          in: workoutTypesForDB,
        },
      },
    });

    let usableBlocks = blocks;
    let fallbackUsed = false;

    if (usableBlocks.length === 0) {
      const fallbackBlocks = await prisma.exerciseBlock.findMany({
        where: {
          isPublished: true,
          goal,
          fitnessLevel: payload.fitnessLevel as FitnessLevel,
        },
        take: 50,
      });

      if (fallbackBlocks.length === 0) {
        console.error("No exercises found for", { goal, fitnessLevel: payload.fitnessLevel, location: payload.location, workoutTypesForDB });
        return NextResponse.json(
          {
            ok: false,
            error: "We couldn't find exercises matching those filters. Try a different location or workout type.",
          },
          { status: 404 }
        );
      }

      usableBlocks = fallbackBlocks;
      fallbackUsed = true;
    }

    const split = createWorkoutSplit(payload.daysPerWeek);
    const days: WorkoutDay[] = [];
    const usedExerciseIds = new Set<number>();

    for (let i = 0; i < payload.daysPerWeek; i++) {
      const daySplit = split[i % split.length];
      const day = buildDay(i, daySplit, usableBlocks, usedExerciseIds);
      days.push(day);
    }

    const notes: string[] = [];
    if (bodyweightAutoIncluded) {
      notes.push("Strength sessions may include bodyweight exercises alongside equipment-based ones.");
    }
    if (fallbackUsed) {
      notes.push("We broadened the exercise search beyond your exact location/type filters to build a complete plan.");
    }
    if (days.some(d => d.sparse)) {
      notes.push("Some days have fewer exercises than usual due to limited matches - consider varying your workout types.");
    }

    return NextResponse.json({
      ok: true,
      planId: crypto.randomUUID(),
      plan: {
        goal: payload.goal,
        fitnessLevel: payload.fitnessLevel,
        daysPerWeek: payload.daysPerWeek,
        location: fallbackUsed ? undefined : payload.location,
        workoutTypes: payload.workoutTypes,
        days,
      },
      fallbackUsed,
      notes,
    });
  } catch (err) {
    console.error("Error generating workout plan:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Something went wrong while generating your workout plan. Please try again.",
        ...(isDev && { message: err instanceof Error ? err.message : "Unknown error" }),
      },
      { status: 500 }
    );
  }
}
