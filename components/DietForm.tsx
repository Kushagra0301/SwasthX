"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DietRequestSchema } from "../lib/schemas";
import type { z } from "zod";
import { downloadDietPDF, downloadPDF } from "@/lib/pdf";

type DietInput = z.input<typeof DietRequestSchema>;

// This describes one suggested meal returned by the API.
type MealSuggestion = {
  mealId: number;
  title: string;
  scale: number; // serving multiplier (e.g., 1.2x of base portion)
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  tags?: string[]; // e.g. ["veg", "high-protein"]
  recipeUrl?: string | null;
};
type MealBlock = {
  id: number;
  title: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: string;
  dietType: "VEG" | "NON_VEG";
  goal: "WEIGHT_LOSS" | "MAINTENANCE" | "MUSCLE_GAIN";
};

// This describes the full response returned by /api/generate-diet
interface DietPlanResult {
  dietResponseId: number;
  planId: number;
  plan: {
    totalCalories: { min: number; max: number };
    perMeal: { calories: { min: number; max: number } };
    proteinG: { min: number; max: number };
    carbsG: { min: number; max: number };
    fatG: { min: number; max: number };
  };
  meals: {
    BREAKFAST: MealBlock | null;
    LUNCH: MealBlock | null;
    DINNER: MealBlock | null;
    SNACK: MealBlock | null;
  };
}

export default function DietForm() {
  const [result, setResult] = useState<DietPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWorkoutPlan, setHasWorkoutPlan] = useState(false);

  useEffect(() => {
    const workoutPlan = localStorage.getItem('workoutPlan');
    setHasWorkoutPlan(!!workoutPlan);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DietInput>({
    resolver: zodResolver(DietRequestSchema),
    defaultValues: {
      age: 25,
      gender: "MALE",
      weightKg: 70,
      heightCm: 175,
      activityLevel: "MODERATE",
      goal: "WEIGHT_LOSS",
      dietPreference: "NON_VEG"
    },
  });

  const onSubmit = async (data: DietInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Server error");
      } else {
        setResult(json);
        // Save diet plan to localStorage for PDF generation
        localStorage.setItem('dietPlan', JSON.stringify({
          ...json.plan,
          meals: json.meals
        }));
        // Check if workout plan exists
        const workoutPlan = localStorage.getItem('workoutPlan');
        setHasWorkoutPlan(!!workoutPlan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Form Section */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6">
          Personal Information
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Age
              </label>
              <input
                type="number"
                {...register("age", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="25"
              />
              {errors.age?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.age.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Gender
              </label>
              <select
                {...register("gender")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                {...register("weightKg", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="70"
              />
              {errors.weightKg?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.weightKg.message}
                </p>
              )}
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                {...register("heightCm", { valueAsNumber: true })}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="175"
              />
              {errors.heightCm?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.heightCm.message}
                </p>
              )}
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Activity Level
              </label>
              <select
                {...register("activityLevel")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="SEDENTARY">Sedentary</option>
                <option value="LIGHT">Light</option>
                <option value="MODERATE">Moderate</option>
                <option value="VERY_ACTIVE">Very Active</option>
                <option value="SUPER_ACTIVE">Super Active</option>
              </select>
              {errors.activityLevel?.message && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.activityLevel.message}
                </p>
              )}
            </div>

            {/* Primary Goal */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Primary Goal
              </label>
              <select
                {...register("goal")}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

            {/* Diet Preference */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Diet Preference
              </label>
                <select
                  {...register("dietPreference")}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VEG">Vegetarian</option>
                  <option value="NON_VEG">Non-Vegetarian</option>
                </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? "Generating..." : "Generate Diet Plan"}
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-zinc-100">
              Your Diet Plan
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => downloadDietPDF()}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 flex items-center gap-2"
              >
                <span>Download PDF</span>
                {hasWorkoutPlan && (
                  <span className="text-xs bg-green-700 px-2 py-1 rounded">
                    + Workout
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Daily Calories</p>
              <p className="text-2xl font-semibold text-zinc-100">
                {result.plan.totalCalories.min}–{result.plan.totalCalories.max}
              </p>
              <p className="text-xs text-zinc-500 mt-1">kcal</p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Per Meal</p>
              <p className="text-2xl font-semibold text-zinc-100">
                {result.plan.perMeal.calories.min}–
                {result.plan.perMeal.calories.max}
              </p>
              <p className="text-xs text-zinc-500 mt-1">kcal</p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Protein</p>
              <p className="text-2xl font-semibold text-zinc-100">
                {result.plan.proteinG.min}–{result.plan.proteinG.max}
              </p>
              <p className="text-xs text-zinc-500 mt-1">grams</p>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Carbs</p>
              <p className="text-2xl font-semibold text-zinc-100">
                {result.plan.carbsG.min}–{result.plan.carbsG.max}
              </p>
              <p className="text-xs text-zinc-500 mt-1">grams</p>
            </div>
          </div>

          {/* Full Plan Details */}
          {/* Meal suggestions */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-zinc-100 mb-4">
              Your Meals for the Day
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(result.meals).map(([slot, meal]) => (
                <div
                  key={slot}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
                >
                  <p className="text-xs text-zinc-500 mb-1">{slot}</p>

                  {meal ? (
                    <>
                      <p className="text-sm font-semibold text-zinc-100 mb-2">
                        {meal.title}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
                        <div>
                          <span className="text-zinc-500">Calories:</span>{" "}
                          <strong>{meal.calories}</strong> kcal
                        </div>
                        <div>
                          <span className="text-zinc-500">Protein:</span>{" "}
                          <strong>{meal.proteinG}</strong> g
                        </div>
                        <div>
                          <span className="text-zinc-500">Carbs:</span>{" "}
                          <strong>{meal.carbsG}</strong> g
                        </div>
                        <div>
                          <span className="text-zinc-500">Fat:</span>{" "}
                          <strong>{meal.fatG}</strong> g
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-2">
                        Ingredients: {meal.ingredients}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-yellow-400">
                      No meal found for this slot
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}