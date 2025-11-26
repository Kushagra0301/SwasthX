// app/plans/[id]/page.tsx

import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// --- Types describing the payload shapes ---

type DietPlanPayload = {
  plan: {
    totalCalories: { min: number; max: number };
    perMeal: {
      calories: { min: number; max: number };
      proteinG: { min: number; max: number };
      fatG: { min: number; max: number };
      carbsG: { min: number; max: number };
    };
    proteinG: { min: number; max: number };
    fatG: { min: number; max: number };
    carbsG: { min: number; max: number };
  };
  mealSuggestions: Array<{
    mealId: number;
    title: string;
    scale: number;
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    tags?: string[];
    recipeUrl?: string | null;
  }>;
};

type WorkoutPlanPayload = {
  goal: string;
  fitnessLevel: string;
  daysPerWeek: number;
  location: string;
  workoutTypes: string[];
  days: Array<{
    dayLabel: string;
    focus: string;
    warmup: string[];
    exercises: Array<{
      name: string;
      muscleGroup: string;
      sets: number;
      repsOrTime: string;
      equipment: string;
      notes?: string;
    }>;
    cooldown: string[];
  }>;
};

function formatDateTime(dt: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt);
}

interface PlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanPageProps) {
  // Await the params first
  const { id } = await params;

  // 1) Ensure the user is logged in
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = Number(session.user.id);

  // 2) Parse plan ID from params
  const planId = Number(id);
  if (Number.isNaN(planId)) {
    notFound();
  }

  // 3) Load the plan from the database
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  // 4) If no plan found, or it belongs to a different user, show 404
  if (!plan || plan.userId !== userId) {
    notFound();
  }

  // 5) Plan exists and belongs to current user
  const createdAt = plan.generatedAt;
  const payload: any = plan.payload;

  const isDiet = plan.type === 'DIET';
  const isWorkout = plan.type === 'WORKOUT';

  return (
    <main className="min-h-[calc(100vh-4rem)] py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header: Plan title + type + date */}
        <div className="mb-6">
          <p className="text-xs uppercase text-zinc-500 tracking-wide mb-1">
            Plan #{plan.id} · {isDiet ? 'Diet Plan' : isWorkout ? 'Workout Plan' : plan.type}
          </p>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {plan.title || (isDiet ? 'Diet Plan' : 'Workout Plan')}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Generated on {formatDateTime(createdAt)}
          </p>
        </div>

        {/* Content area: branch by type */}
        <div className="space-y-8">
          {isDiet && <DietPlanDetail payload={payload as DietPlanPayload} />}
          {isWorkout && <WorkoutPlanDetail payload={payload as WorkoutPlanPayload} />}

          {!isDiet && !isWorkout && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
              <p>
                This plan type (<span className="font-mono">{plan.type}</span>) does not have a
                custom detail view yet. Raw payload:
              </p>
              <pre className="mt-3 text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-auto">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// --- Diet Plan Detail view component ---

function DietPlanDetail({ payload }: { payload: DietPlanPayload }) {
  const { plan, mealSuggestions } = payload;

  // Create unique keys for meal suggestions to handle duplicate mealId values
  const getMealKey = (meal: any, index: number) => {
    // Use a combination of mealId and index to ensure uniqueness
    return `${meal.mealId}-${index}-${meal.title?.replace(/\s+/g, '-')}`;
  };

  return (
    <section className="space-y-6">
      {/* Macro summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-xs text-zinc-500 mb-1">Daily Calories</p>
          <p className="text-lg font-semibold text-zinc-100">
            {plan.totalCalories.min}–{plan.totalCalories.max}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">kcal / day</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-xs text-zinc-500 mb-1">Per Meal Calories</p>
          <p className="text-lg font-semibold text-zinc-100">
            {plan.perMeal.calories.min}–{plan.perMeal.calories.max}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">kcal / meal (target)</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-xs text-zinc-500 mb-1">Protein</p>
          <p className="text-lg font-semibold text-zinc-100">
            {plan.proteinG.min}–{plan.proteinG.max}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">g / day</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
          <p className="text-xs text-zinc-500 mb-1">Carbs</p>
          <p className="text-lg font-semibold text-zinc-100">
            {plan.carbsG.min}–{plan.carbsG.max}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">g / day (approx)</p>
        </div>
      </div>

      {/* Meal suggestions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">
          Meal Suggestions
        </h2>
        {mealSuggestions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No meal suggestions were generated for this plan.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mealSuggestions.map((ms, index) => (
              <div
                key={getMealKey(ms, index)} // Use the unique key function
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs text-zinc-500">Meal #{ms.mealId}</p>
                    <p className="text-sm font-semibold text-zinc-100">
                      {ms.title}
                    </p>
                  </div>
                  {ms.tags && ms.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {ms.tags.map((tag, tagIndex) => (
                        <span
                          key={`${tag}-${tagIndex}`} // Also make tag keys unique
                          className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] uppercase tracking-wide text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 mb-2">
                  <div>
                    <span className="text-zinc-500">Calories:</span>{' '}
                    <span className="font-semibold">{ms.calories}</span> kcal
                  </div>
                  <div>
                    <span className="text-zinc-500">Protein:</span>{' '}
                    <span className="font-semibold">{ms.proteinG}</span> g
                  </div>
                  <div>
                    <span className="text-zinc-500">Carbs:</span>{' '}
                    <span className="font-semibold">{ms.carbsG}</span> g
                  </div>
                  <div>
                    <span className="text-zinc-500">Fat:</span>{' '}
                    <span className="font-semibold">{ms.fatG}</span> g
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 mb-2">
                  Portion multiplier:{' '}
                  <span className="font-semibold text-zinc-200">
                    {ms.scale.toFixed(2)}×
                  </span>{' '}
                  of base recipe.
                </p>

                {ms.recipeUrl && (
                  <a
                    href={ms.recipeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    View full recipe
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// --- Workout Plan Detail view component ---

function WorkoutPlanDetail({ payload }: { payload: WorkoutPlanPayload }) {
  return (
    <section className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          Goal: <span className="font-semibold">{payload.goal}</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          Level: <span className="font-semibold">{payload.fitnessLevel}</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          Location: <span className="font-semibold">{payload.location}</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          Days / week:{' '}
          <span className="font-semibold">{payload.daysPerWeek}</span>
        </span>
      </div>

      {/* Days list */}
      <div className="space-y-4">
        {payload.days.map((day, index) => (
          <div
            key={`${day.dayLabel}-${index}`} // Ensure day keys are unique
            className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">
                  {day.dayLabel}
                </p>
                <p className="text-lg font-semibold text-zinc-100">
                  {day.focus}
                </p>
              </div>
            </div>

            {/* Warmup */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                Warm-up
              </p>
              <ul className="list-disc list-inside text-xs text-zinc-300 space-y-0.5">
                {day.warmup.map((w, idx) => (
                  <li key={`warmup-${index}-${idx}`}>{w}</li> // Unique warmup keys
                ))}
              </ul>
            </div>

            {/* Main exercises */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                Main exercises
              </p>
              <div className="space-y-2">
                {day.exercises.map((ex, idx) => (
                  <div
                    key={`exercise-${index}-${idx}-${ex.name}`} // Unique exercise keys
                    className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs"
                  >
                    <div className="flex justify-between gap-2 mb-1">
                      <p className="font-semibold text-zinc-100">
                        {ex.name}
                      </p>
                      <p className="text-zinc-400">
                        {ex.sets} × {ex.repsOrTime}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {ex.muscleGroup} · {ex.equipment}
                    </p>
                    {ex.notes && (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cooldown */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                Cool-down
              </p>
              <ul className="list-disc list-inside text-xs text-zinc-300 space-y-0.5">
                {day.cooldown.map((c, idx) => (
                  <li key={`cooldown-${index}-${idx}`}>{c}</li> // Unique cooldown keys
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}