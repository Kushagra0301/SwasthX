"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DietRequestSchema } from "../lib/schemas";
import type { z } from "zod";
import { downloadDietPDF } from "@/lib/pdf";

type DietInput = z.input<typeof DietRequestSchema>;

type MealBlock = {
  id: number;
  title: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "SNACK1" | "SNACK2" | "SNACK3";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: string;
  dietType: "VEG" | "NON_VEG";
  goal: "WEIGHT_LOSS" | "MAINTENANCE" | "MUSCLE_GAIN";
};

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
  meals: Record<string, MealBlock | null>;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Sarcastic loading messages
const LOADING_MESSAGES = [
  "Calculating how many avocados you can afford...",
  "Asking ChatGPT for kale recipes...",
  "Convincing your taste buds this will be fine...",
  "Measuring willpower in pizza slices...",
  "Finding excuses for cheat days...",
  "Pretending broccoli tastes good...",
  "Counting calories so you don't have to...",
  "Making sure you'll still have energy for doomscrolling...",
  "Calculating optimal coffee-to-water ratio...",
  "Resisting the urge to recommend pizza...",
];

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
  SNACK1: "Morning Snack",
  SNACK2: "Afternoon Snack",
  SNACK3: "Evening Snack"
};

const MEAL_ORDER = ['BREAKFAST', 'SNACK1', 'LUNCH', 'SNACK2', 'DINNER', 'SNACK3', 'SNACK'];

export default function DietForm() {
  const [result, setResult] = useState<DietPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWorkoutPlan, setHasWorkoutPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [formStep, setFormStep] = useState<"form" | "result">("form");

  useEffect(() => {
    const workoutPlan = localStorage.getItem('workoutPlan');
    setHasWorkoutPlan(!!workoutPlan);
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        const randomMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
        setLoadingMessage(randomMessage);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
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
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      const res = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Our food processor overheated. Try again?");
      } else {
        // Process meals to ensure all 6 meals are properly structured
        const processedMeals = processMealsData(json.meals);
        const updatedResult = {
          ...json,
          meals: processedMeals
        };
        
        setResult(updatedResult);
        setFormStep("result");
        
        // Save diet plan to localStorage for PDF generation
        localStorage.setItem('dietPlan', JSON.stringify({
          ...json.plan,
          meals: processedMeals,
          totals: json.totals || {
            calories: Object.values(processedMeals).reduce((sum, meal) => sum + (meal?.calories || 0), 0),
            protein: Object.values(processedMeals).reduce((sum, meal) => sum + (meal?.proteinG || 0), 0),
            carbs: Object.values(processedMeals).reduce((sum, meal) => sum + (meal?.carbsG || 0), 0),
            fat: Object.values(processedMeals).reduce((sum, meal) => sum + (meal?.fatG || 0), 0)
          }
        }));
        
        // Check if workout plan exists
        const workoutPlan = localStorage.getItem('workoutPlan');
        setHasWorkoutPlan(!!workoutPlan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error - probably ate all the bandwidth");
    } finally {
      setLoading(false);
    }
  };

  const processMealsData = (meals: Record<string, MealBlock | null>) => {
    const processed: Record<string, MealBlock | null> = {};
    
    // Check if we have 6-meal structure
    const hasSixMeals = meals.SNACK1 || meals.SNACK2 || meals.SNACK3;
    
    if (hasSixMeals) {
      // 6-meal structure
      MEAL_ORDER.forEach(key => {
        if (meals[key] !== undefined) {
          processed[key] = meals[key];
        }
      });
    } else {
      // 4-meal structure - map SNACK to SNACK1 for consistency
      processed.BREAKFAST = meals.BREAKFAST || null;
      processed.LUNCH = meals.LUNCH || null;
      processed.DINNER = meals.DINNER || null;
      processed.SNACK1 = meals.SNACK || null; // Map SNACK to SNACK1
      processed.SNACK2 = null;
      processed.SNACK3 = null;
    }
    
    return processed;
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
    setFormStep("form");
  };

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      BREAKFAST: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      LUNCH: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      DINNER: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      SNACK: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      SNACK1: "bg-blue-400/20 text-blue-200 border-blue-400/30",
      SNACK2: "bg-blue-300/20 text-blue-100 border-blue-300/30",
      SNACK3: "bg-blue-200/20 text-blue-50 border-blue-200/30"
    };
    return colors[type] || "bg-zinc-800/50 text-zinc-300 border-zinc-700";
  };

  // Get sorted meal keys for display
  const getSortedMealKeys = () => {
    if (!result?.meals) return [];
    
    return Object.keys(result.meals)
      .sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
      .filter(key => result.meals[key] !== null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-8 px-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100 bg-clip-text text-transparent mb-3">
            Diet Plan Generator
          </h1>
          <p className="text-zinc-400 text-lg">
            Because guessing doesn't burn calories 🤷‍♂️
          </p>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="text-center max-w-md mx-4">
              {/* Spinner */}
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-zinc-800 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-transparent border-t-blue-500 rounded-full absolute top-0 left-0 animate-spin"></div>
                <div className="w-16 h-16 border-4 border-transparent border-b-purple-500 rounded-full absolute top-4 left-4 animate-spin-reverse"></div>
                <div className="w-8 h-8 border-4 border-transparent border-r-emerald-500 rounded-full absolute top-8 left-8 animate-spin"></div>
              </div>
              
              <h3 className="text-xl font-semibold text-zinc-100 mb-4">
                Cooking up your perfect diet...
              </h3>
              <p className="text-zinc-400 italic mb-2 transition-opacity duration-500">
                "{loadingMessage}"
              </p>
              <div className="flex justify-center space-x-1 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form Section */}
        {formStep === "form" && (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6 md:p-8 mb-8 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-zinc-100">
                Tell Us About Your 🍽️
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-zinc-400">Ready to calculate</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Age */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-zinc-300">
                      Age
                    </label>
                    <span className="text-xs text-zinc-500">Years of wisdom</span>
                  </div>
                  <input
                    type="number"
                    {...register("age", { valueAsNumber: true })}
                    className={`w-full px-4 py-3 bg-zinc-800/50 border ${errors.age ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600`}
                    placeholder="25"
                  />
                  {errors.age?.message && (
                    <p className="text-sm text-red-400 animate-shake">
                      ⚠️ {errors.age.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Gender
                  </label>
                  <select
                    {...register("gender")}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                  >
                    <option value="MALE">♂ Male</option>
                    <option value="FEMALE">♀ Female</option>
                    <option value="OTHER">⚧ Other</option>
                  </select>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-zinc-300">
                      Weight
                    </label>
                    <span className="text-xs text-zinc-500">kg</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      {...register("weightKg", { valueAsNumber: true })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                      placeholder="70"
                    />
                    <div className="absolute right-3 top-3 text-zinc-500">
                      ⚖️
                    </div>
                  </div>
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-zinc-300">
                      Height
                    </label>
                    <span className="text-xs text-zinc-500">cm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      {...register("heightCm", { valueAsNumber: true })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                      placeholder="175"
                    />
                    <div className="absolute right-3 top-3 text-zinc-500">
                      📏
                    </div>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-zinc-300">
                      Activity Level
                    </label>
                    <span className="text-xs text-zinc-500">Be honest! 😉</span>
                  </div>
                  <select
                    {...register("activityLevel")}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                  >
                    <option value="SEDENTARY">🥔 Sedentary</option>
                    <option value="LIGHT">🚶‍♂️ Light</option>
                    <option value="MODERATE">🏃‍♂️ Moderate</option>
                    <option value="VERY_ACTIVE">💪 Very Active</option>
                    <option value="SUPER_ACTIVE">🔥 Super Active</option>
                  </select>
                </div>

                {/* Primary Goal */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Primary Goal
                  </label>
                  <select
                    {...register("goal")}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                  >
                    <option value="WEIGHT_LOSS">🔥 Weight Loss</option>
                    <option value="MUSCLE_GAIN">💪 Muscle Gain</option>
                    <option value="MAINTENANCE">⚖️ Maintenance</option>
                    <option value="ENDURANCE">🏃‍♂️ Endurance</option>
                  </select>
                </div>

                {/* Diet Preference */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Diet Preference
                  </label>
                  <select
                    {...register("dietPreference")}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                  >
                    <option value="VEG">🥦 Vegetarian</option>
                    <option value="NON_VEG">🍗 Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-zinc-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3.5 font-medium rounded-xl transition-all duration-300 flex-1 sm:flex-none ${isValid ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-zinc-800 cursor-not-allowed'} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Cooking...
                      </>
                    ) : (
                      <>
                        🍳 Generate Diet Plan
                      </>
                    )}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-8 py-3.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 font-medium rounded-xl border border-zinc-700/50 transition-all duration-300 hover:border-zinc-600 hover:scale-[1.02] active:scale-[0.98] flex-1 sm:flex-none"
                >
                  <span className="flex items-center justify-center gap-2">
                    ↺ Reset All
                  </span>
                </button>
              </div>

              {/* Form Status Indicator */}
              <div className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {isValid ? "✓ All set! Ready to cook!" : "Fill in all the details above..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                    <span className="text-zinc-400">Form status</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 mb-8 animate-shake">
            <div className="flex items-start gap-3">
              <div className="text-2xl">😬</div>
              <div>
                <p className="text-red-400 font-medium mb-1">
                  Oops! Something went wrong...
                </p>
                <p className="text-red-300/80 text-sm">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Dismiss this delicious disaster →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && formStep === "result" && (
          <div className="space-y-8 animate-slide-up">
            {/* Results Header */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-zinc-100 mb-2">
                    Your Personalized Diet Plan 🎉
                  </h3>
                  <p className="text-zinc-400">
                    {Object.values(result.meals).filter(Boolean).length} meals • Made with ❤️ (and lots of math)
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => setFormStep("form")}
                    className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 font-medium rounded-xl border border-zinc-700/50 transition-all duration-300 hover:border-zinc-600 w-full sm:w-auto"
                  >
                    ← Edit Details
                  </button>
                  
                  <button
                    onClick={() => downloadDietPDF()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center gap-2">
                      📥 Download PDF
                      {hasWorkoutPlan && (
                        <span className="text-xs bg-emerald-700 px-2 py-1 rounded-full">
                          + Workout Plan
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">🔥</div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Daily
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Calories</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.totalCalories.min}–{result.plan.totalCalories.max}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Total: {result.totals?.calories || 0} kcal
                  </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">🍽️</div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Per Meal
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Calories</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.perMeal.calories.min}–
                    {result.plan.perMeal.calories.max}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {Object.values(result.meals).filter(Boolean).length} meals
                  </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">💪</div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Protein
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Daily Target</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.proteinG.min}–{result.plan.proteinG.max}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Total: {result.totals?.protein || 0}g
                  </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">⚡</div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Carbs
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Daily Target</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.carbsG.min}–{result.plan.carbsG.max}g
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Total: {result.totals?.carbs || 0}g
                  </p>
                </div>
              </div>

              {/* Meal Plan */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-zinc-100">
                    Today's Menu 🍴 ({getSortedMealKeys().length} meals)
                  </h4>
                  <div className="text-sm text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                    Ready to eat!
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSortedMealKeys().map((slot) => {
                    const meal = result.meals[slot];
                    if (!meal) return null;
                    
                    return (
                      <div
                        key={slot}
                        className={`rounded-xl border p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${getMealTypeColor(slot)}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getMealTypeColor(slot)}`}>
                            {MEAL_LABELS[slot] || slot}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {meal.goal === 'WEIGHT_LOSS' ? '🔥' : 
                             meal.goal === 'MUSCLE_GAIN' ? '💪' : '⚖️'}
                          </span>
                        </div>

                        <h5 className="text-lg font-semibold text-zinc-100 mb-3">
                          {meal.title}
                        </h5>

                        {/* Nutrition Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                            <span className="text-zinc-400 text-xs">🔥</span>
                            <span className="text-sm text-zinc-200">{meal.calories}</span>
                            <span className="text-xs text-zinc-500">kcal</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                            <span className="text-zinc-400 text-xs">💪</span>
                            <span className="text-sm text-zinc-200">{meal.proteinG}g</span>
                            <span className="text-xs text-zinc-500">protein</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                            <span className="text-zinc-400 text-xs">⚡</span>
                            <span className="text-sm text-zinc-200">{meal.carbsG}g</span>
                            <span className="text-xs text-zinc-500">carbs</span>
                          </div>
                        </div>

                        {/* Ingredients */}
                        <div className="mt-4 pt-4 border-t border-zinc-800/50">
                          <p className="text-xs text-zinc-400 mb-2">🥄 Ingredients:</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {meal.ingredients}
                          </p>
                        </div>

                        {/* Diet Type Badge */}
                        <div className="mt-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${meal.dietType === 'VEG' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {meal.dietType === 'VEG' ? '🥦 Vegetarian' : '🍗 Non-Veg'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pro Tips */}
                <div className="mt-8 pt-6 border-t border-zinc-800/50">
                  <div className="flex items-start gap-3 bg-zinc-800/30 rounded-xl p-4">
                    <div className="text-2xl">💡</div>
                    <div>
                      <p className="text-zinc-300 font-medium mb-1">Pro Tip!</p>
                      <p className="text-zinc-400 text-sm">
                        Drink plenty of water, don't skip meals, and remember: consistency beats perfection every time.
                        {result.plan.totalCalories.max > 3000 && " (You might want to split those larger portions!)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-zinc-500 text-sm">
                Plan ID: <span className="text-zinc-400 font-mono">{result.planId}</span> • 
                Generated just now • Ready to transform! 🚀
              </p>
              <button
                onClick={handleReset}
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                🍳 Generate another plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add these styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
}