"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WorkoutRequestSchema } from "@/lib/schemas";
import type z from "zod";
import { POST } from "@/app/api/generate-diet/route";

// z.input<typeof WorkoutRequestSchema> means "whatever the schema expects as input".
type WorkoutInput = z.input<typeof WorkoutRequestSchema>;

interface WorkoutPlanResult {
  workoutResponseId: number;
  planId: number;
  plan: {
    goal: string;
    fitnessLevel: string;
    daysPerWeek: number;
    location: string;
    workoutTypes: string[];
    days: {
      dayLabel: string;
      focus: string;
      warmup: string[];
      exercises: {
        name: string;
        muscleGroup: string;
        sets: number;
        repsOrTime: string;
        equipment: string;
        notes?: string;
      }[];
      cooldown: string[];
    }[];
  };
}

export default function WorkoutForm() {
  const [result, setResult] = useState<WorkoutPlanResult | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkoutInput>({
    resolver: zodResolver(WorkoutRequestSchema),
    defaultValues: {
      gender: "MALE",
      fitnessLevel: "BEGINNER",
      goal: "WEIGHT_LOSS",
      location: "HOME",
      workoutTypes: ["STRENGTH", "CARDIO"],
      daysPerWeek: 4,
    },
  });

  const onSubmit = async (data: WorkoutInput) => {
    setLoading: true;
    setError: null;
    setResult: null;

    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error || "Server error while generating workout plan");
      } else {
        // If everything is fine, we store the plan in result.
        setResult(json as WorkoutPlanResult);
      }
    } catch (err) {
      // This catch block handles network errors (e.g., no internet).
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
    } finally {
      // Whatever happens, we turn off the loading state at the end.
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* FORM CONTAINER */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6">
          Workout Questionnaire
        </h2>

        {/* The form tag. handleSubmit(onSubmit) will do validation before calling onSubmit. */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* First grid: gender, fitness level, goal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Gender
              </label>
              <select
                {...register("gender")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.gender.message}
                </p>
              )}
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Fitness Level
              </label>
              <select
                {...register("fitnessLevel")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              {errors.fitnessLevel?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.fitnessLevel.message}
                </p>
              )}
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Primary Goal
              </label>
              <select
                {...register("goal")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="WEIGHT_LOSS">Weight Loss</option>
                <option value="MUSCLE_GAIN">Muscle Gain</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ENDURANCE">Endurance</option>
              </select>
              {errors.goal?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.goal.message}
                </p>
              )}
            </div>
          </div>

          {/* Location + Days Per Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Workout Location
              </label>
              <select
                {...register("location")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="HOME">Home</option>
                <option value="GYM">Gym</option>
              </select>
              {errors.location?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Days per week */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Workout Days per Week
              </label>
              <input
                type="number"
                {...register("daysPerWeek", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4"
              />
              {errors.daysPerWeek?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.daysPerWeek.message}
                </p>
              )}
            </div>
          </div>

          {/* Workout Types - checkboxes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Workout Types You Prefer
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-zinc-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="STRENGTH"
                  {...register("workoutTypes")}
                  className="accent-blue-500"
                />
                <span>Strength</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="CARDIO"
                  {...register("workoutTypes")}
                  className="accent-blue-500"
                />
                <span>Cardio</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="HIIT"
                  {...register("workoutTypes")}
                  className="accent-blue-500"
                />
                <span>HIIT</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="BODYWEIGHT"
                  {...register("workoutTypes")}
                  className="accent-blue-500"
                />
                <span>Bodyweight</span>
              </label>
            </div>
            {errors.workoutTypes?.message && (
              <p className="mt-1.5 text-sm text-red-400">
                {errors.workoutTypes.message as string}
              </p>
            )}
          </div>

          {/* Buttons: Submit + Reset */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? "Generating..." : "Generate Workout Plan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg border border-zinc-700 transition duration-200"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* ERROR BOX */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* RESULTS SECTION */}
      {result && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-zinc-100">
              Your Workout Plan
            </h3>
            <div className="text-sm text-zinc-500">
              Plan ID: <span className="text-zinc-300">{result.planId}</span>
            </div>
          </div>

          {/* Plan summary header */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-zinc-300">
            <div>
              <span className="text-zinc-500">Goal:</span>{" "}
              <span className="font-medium">{result.plan.goal}</span>
            </div>
            <div>
              <span className="text-zinc-500">Level:</span>{" "}
              <span className="font-medium">{result.plan.fitnessLevel}</span>
            </div>
            <div>
              <span className="text-zinc-500">Days / week:</span>{" "}
              <span className="font-medium">{result.plan.daysPerWeek}</span>
            </div>
            <div>
              <span className="text-zinc-500">Location:</span>{" "}
              <span className="font-medium">{result.plan.location}</span>
            </div>
          </div>

          {/* Days list */}
          <div className="space-y-4">
            {result.plan.days.map((day, index) => (
              <div
                key={index}
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

                  {/* Small status chips */}
                  <div className="flex flex-col items-end gap-1 text-[11px] text-zinc-400">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                      {result.plan.location}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                      {result.plan.fitnessLevel}
                    </span>
                  </div>
                </div>

                {/* Warmup */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                    Warm-up
                  </p>
                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                    {day.warmup.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                {/* Exercises */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                    Main Exercises
                  </p>
                  <div className="space-y-2">
                    {day.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border-b border-zinc-800 pb-2 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {ex.name}{" "}
                            <span className="text-xs text-zinc-500">
                              ({ex.muscleGroup})
                            </span>
                          </p>
                          {ex.notes && (
                            <p className="text-xs text-zinc-500">{ex.notes}</p>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 flex gap-3">
                          <span>Sets: {ex.sets}</span>
                          <span>{ex.repsOrTime}</span>
                          <span>{ex.equipment}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cooldown */}
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                    Cooldown
                  </p>
                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                    {day.cooldown.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Raw JSON details (optional for debugging) */}
          <details className="group mt-6">
            <summary className="cursor-pointer text-sm font-medium text-zinc-300 hover:text-zinc-100 flex items-center gap-2">
              <span className="transform group-open:rotate-90 transition-transform">
                ▶
              </span>
              View Raw Plan JSON (for dev/debug)
            </summary>
            <pre className="mt-3 bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-auto text-xs text-zinc-300 max-h-80">
              {JSON.stringify(result.plan, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
