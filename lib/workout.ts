// lib/workout.ts

// 1) We reuse the same FitnessGoal type as in tdee.ts so it's consistent.
//    If you prefer, you can import it from tdee.ts, but here we re-declare for clarity.
export type FitnessGoal = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'ENDURANCE';

// 2) Fitness level of the user: used to adjust sets/reps and intensity.
export type FitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// 3) Where the user trains: we use this to decide equipment suggestions.
export type WorkoutLocation = 'HOME' | 'GYM';

// 4) Types of workouts user likes: strength, cardio, HIIT, bodyweight, etc.
export type WorkoutType =
  | 'STRENGTH'
  | 'CARDIO'
  | 'HIIT'
  | 'BODYWEIGHT';

// 5) This is the input that our workout planner function expects.
//    It is like a DTO (data transfer object) for workout settings.
export interface WorkoutInput {
  goal: FitnessGoal;          // fat loss, muscle gain, etc.
  fitnessLevel: FitnessLevel; // beginner, intermediate, advanced
  daysPerWeek: number;        // how many days they can train (1-7)
  location: WorkoutLocation;  // HOME or GYM
  workoutTypes: WorkoutType[];// what they like (can be multiple)
}

// 6) A single exercise that will appear in a day of the plan.
//    We keep it simple for now.
export interface WorkoutExercise {
  name: string;         // e.g. "Squats"
  muscleGroup: string;  // e.g. "Legs"
  sets: number;         // e.g. 3
  repsOrTime: string;   // e.g. "8-12 reps" or "30 sec"
  equipment: string;    // e.g. "Bodyweight", "Dumbbells", "Barbell"
  notes?: string;       // extra tips
}

// 7) A single day in the weekly workout plan.
export interface WorkoutDayPlan {
  dayLabel: string;          // e.g. "Day 1", "Day 2"
  focus: string;             // e.g. "Full Body", "Upper Body", "Cardio + Core"
  warmup: string[];          // list of warmup activities
  exercises: WorkoutExercise[]; // main exercises list
  cooldown: string[];        // list of cooldown / stretching items
}

// 8) The full weekly plan that our function will return.
export interface WorkoutPlan {
  goal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  daysPerWeek: number;
  location: WorkoutLocation;
  workoutTypes: WorkoutType[];
  days: WorkoutDayPlan[];
}

// 9) Helper: choose how many sets per exercise based on fitness level.
function setsForLevel(level: FitnessLevel): number {
  if (level === 'BEGINNER') return 3;
  if (level === 'INTERMEDIATE') return 4;
  return 4; // ADVANCED can also be 4; intensity can come from exercise choice later
}

// 10) Helper: create a generic full-body strength day for HOME or GYM.
function buildFullBodyDay(
  label: string,
  level: FitnessLevel,
  location: WorkoutLocation
): WorkoutDayPlan {
  const sets = setsForLevel(level);

  // Simple warmup - we use the same for all days for now.
  const warmup = [
    '5 min light cardio (walk / cycle / skipping)',
    'Dynamic stretches (arm circles, leg swings, hip circles)'
  ];

  const cooldown = [
    '5–10 min light walking / breathing',
    'Static stretching for major muscle groups'
  ];

  // For HOME vs GYM we change equipment suggestions a bit.
  const isHome = location === 'HOME';

  const exercises: WorkoutExercise[] = [
    {
      name: isHome ? 'Bodyweight Squats' : 'Barbell Squats',
      muscleGroup: 'Legs',
      sets,
      repsOrTime: '8–12 reps',
      equipment: isHome ? 'Bodyweight' : 'Barbell',
      notes: 'Focus on form; keep chest up and push through heels.'
    },
    {
      name: isHome ? 'Push-ups' : 'Bench Press',
      muscleGroup: 'Chest',
      sets,
      repsOrTime: '8–12 reps',
      equipment: isHome ? 'Bodyweight' : 'Barbell / Machine',
      notes: 'Control the tempo; full range of motion.'
    },
    {
      name: isHome ? 'Bent-over Backpack Rows' : 'Lat Pulldown',
      muscleGroup: 'Back',
      sets,
      repsOrTime: '8–12 reps',
      equipment: isHome ? 'Backpack / Bands' : 'Cable / Machine',
      notes: 'Squeeze shoulder blades at the top.'
    },
    {
      name: isHome ? 'Glute Bridges' : 'Romanian Deadlift',
      muscleGroup: 'Glutes / Hamstrings',
      sets,
      repsOrTime: '10–15 reps',
      equipment: isHome ? 'Bodyweight' : 'Barbell / Dumbbell',
      notes: 'Drive hips up and squeeze glutes.'
    },
    {
      name: isHome ? 'Plank' : 'Plank',
      muscleGroup: 'Core',
      sets,
      repsOrTime: '30–45 sec hold',
      equipment: 'Bodyweight',
      notes: 'Keep spine neutral; don’t let hips sag.'
    }
  ];

  return {
    dayLabel: label,
    focus: 'Full Body Strength',
    warmup,
    exercises,
    cooldown
  };
}

// 11) Helper: build a cardio + core focused day.
function buildCardioCoreDay(
  label: string,
  level: FitnessLevel,
  location: WorkoutLocation
): WorkoutDayPlan {
  const warmup = [
    '5 min light cardio (walk / cycle / skipping)',
    'Dynamic stretches (hip openers, torso twists)'
  ];

  const cooldown = [
    '5–10 min easy pace cardio',
    'Stretch hip flexors, hamstrings, calves, and lower back'
  ];

  // Cardio intensity based on level
  const baseTime = level === 'BEGINNER' ? 15 : level === 'INTERMEDIATE' ? 20 : 25;
  const cardioEquipment = location === 'HOME'
    ? 'Brisk walk / jog in place / skipping'
    : 'Treadmill / Cross-trainer / Bike';

  const exercises: WorkoutExercise[] = [
    {
      name: 'Steady-state cardio',
      muscleGroup: 'Cardio',
      sets: 1,
      repsOrTime: `${baseTime}–${baseTime + 5} min`,
      equipment: cardioEquipment,
      notes: 'You should be able to talk but not sing.'
    },
    {
      name: 'Mountain Climbers',
      muscleGroup: 'Core / Cardio',
      sets: 3,
      repsOrTime: '20–30 sec',
      equipment: 'Bodyweight',
      notes: 'Keep core tight and back flat.'
    },
    {
      name: 'Dead Bug',
      muscleGroup: 'Core',
      sets: 3,
      repsOrTime: '8–12 reps / side',
      equipment: 'Bodyweight',
      notes: 'Move slowly and keep lower back on the floor.'
    },
    {
      name: 'Side Plank',
      muscleGroup: 'Core',
      sets: 2,
      repsOrTime: '20–30 sec / side',
      equipment: 'Bodyweight',
      notes: 'Keep body in a straight line from head to feet.'
    }
  ];

  return {
    dayLabel: label,
    focus: 'Cardio + Core',
    warmup,
    exercises,
    cooldown
  };
}

// 12) Helper: decide how many strength vs cardio days based on goal & daysPerWeek.
function splitDays(goal: FitnessGoal, daysPerWeek: number) {
  // Very simple logic:
  // - Weight loss: more cardio days
  // - Muscle gain: more strength days
  // - Maintenance / endurance: balanced
  if (goal === 'MUSCLE_GAIN') {
    return {
      strengthDays: Math.max(2, daysPerWeek - 1),
      cardioDays: daysPerWeek - Math.max(2, daysPerWeek - 1)
    };
  }

  if (goal === 'WEIGHT_LOSS') {
    return {
      strengthDays: Math.max(2, Math.floor(daysPerWeek / 2)),
      cardioDays: daysPerWeek - Math.max(2, Math.floor(daysPerWeek / 2))
    };
  }

  // Maintenance / endurance: roughly half-half
  const half = Math.floor(daysPerWeek / 2);
  return {
    strengthDays: half,
    cardioDays: daysPerWeek - half
  };
}

// 13) MAIN FUNCTION: buildWorkoutPlan
//     This is what other parts of your app will call.
export function buildWorkoutPlan(input: WorkoutInput): WorkoutPlan {
  // Make sure daysPerWeek is between 1 and 7.
  const days = Math.min(7, Math.max(1, input.daysPerWeek));

  const { strengthDays, cardioDays } = splitDays(input.goal, days);

  const planDays: WorkoutDayPlan[] = [];

  let dayCounter = 1;

  // First, push strength days (full body)
  for (let i = 0; i < strengthDays; i++) {
    planDays.push(
      buildFullBodyDay(`Day ${dayCounter}`, input.fitnessLevel, input.location)
    );
    dayCounter++;
  }

  // Then, push cardio + core days
  for (let i = 0; i < cardioDays; i++) {
    planDays.push(
      buildCardioCoreDay(`Day ${dayCounter}`, input.fitnessLevel, input.location)
    );
    dayCounter++;
  }

  // Note: we are not yet using workoutTypes heavily.
  // In future, you can:
  // - If user prefers HIIT, change cardio day into intervals.
  // - If user prefers BODYWEIGHT only, adjust strength exercises accordingly.

  const plan: WorkoutPlan = {
    goal: input.goal,
    fitnessLevel: input.fitnessLevel,
    daysPerWeek: days,
    location: input.location,
    workoutTypes: input.workoutTypes,
    days: planDays
  };

  return plan;
}
