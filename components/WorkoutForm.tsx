"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WorkoutRequestSchema } from "@/lib/schemas";
import type z from "zod";
import { downloadPDF, downloadWorkoutPDF } from "@/lib/pdf";

type WorkoutInput = z.input<typeof WorkoutRequestSchema>;

interface WorkoutPlanResult {
  planId: number;
  plan: {
    goal: "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "ENDURANCE";
    fitnessLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    daysPerWeek: number;
    location: "HOME" | "GYM";
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

// Sarcastic loading messages for workouts
const WORKOUT_LOADING_MESSAGES = [
  "Summoning the gains fairy... 🧚‍♂️",
  "Calculating optimal rest times for Instagram scrolling...",
  "Convincing your muscles this is a good idea...",
  "Finding excuses to skip leg day...",
  "Pretending burpees are fun...",
  "Mixing protein powder with hopes and dreams...",
  "Convincing DOMS not to be too mean...",
  "Finding the perfect gym selfie angle...",
  "Counting reps so you don't have to...",
  "Resisting the urge to recommend Netflix instead...",
  "Teaching your sweat glands to cooperate...",
  "Making sure you'll still be able to walk tomorrow...",
];

export default function WorkoutForm() {
  const [result, setResult] = useState<WorkoutPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDietPlan, setHasDietPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [formStep, setFormStep] = useState<"form" | "result">("form");

  // State to track checkbox selections for visual feedback
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "STRENGTH",
    "CARDIO",
  ]);

  useEffect(() => {
    const dietPlan = localStorage.getItem("dietPlan");
    setHasDietPlan(!!dietPlan);
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        const randomMessage =
          WORKOUT_LOADING_MESSAGES[
            Math.floor(Math.random() * WORKOUT_LOADING_MESSAGES.length)
          ];
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
    watch,
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

  // Watch the workoutTypes field for changes
  const workoutTypesWatch = watch("workoutTypes");

  useEffect(() => {
    if (workoutTypesWatch) {
      setSelectedTypes(workoutTypesWatch);
    }
  }, [workoutTypesWatch]);

  const onSubmit = async (data: WorkoutInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingMessage(WORKOUT_LOADING_MESSAGES[0]);

    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error || "Our dumbbells got too heavy. Try again? 💪");
      } else {
        setResult(json as WorkoutPlanResult);
        setFormStep("result");
        // Save workout plan to localStorage for PDF generation
        localStorage.setItem("workoutPlan", JSON.stringify(json.plan));
        // Check if diet plan exists
        const dietPlan = localStorage.getItem("dietPlan");
        setHasDietPlan(!!dietPlan);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Network error - probably too busy lifting";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
    setFormStep("form");
    setSelectedTypes(["STRENGTH", "CARDIO"]);
  };

  const getGoalEmoji = (goal: string) => {
    const emojis: Record<string, string> = {
      WEIGHT_LOSS: "🔥",
      MUSCLE_GAIN: "💪",
      MAINTENANCE: "⚖️",
      ENDURANCE: "🏃‍♂️",
    };
    return emojis[goal] || "🎯";
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: "bg-green-500/20 text-green-300 border-green-500/30",
      INTERMEDIATE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      ADVANCED: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[level] || "bg-zinc-800/50 text-zinc-300 border-zinc-700";
  };

  const getLocationEmoji = (location: string) => {
    return location === "GYM" ? "🏋️‍♂️" : "🏠";
  };

  const getWorkoutTypeColor = (type: string, isSelected: boolean) => {
    if (!isSelected) {
      return "bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-zinc-600";
    }

    const colors: Record<string, string> = {
      STRENGTH: "bg-blue-500/20 border-blue-500/50 text-blue-300",
      CARDIO: "bg-red-500/20 border-red-500/50 text-red-300",
      HIIT: "bg-purple-500/20 border-purple-500/50 text-purple-300",
      BODYWEIGHT: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    };
    return colors[type] || "bg-zinc-800/50 text-zinc-300 border-zinc-700";
  };

  const getWorkoutTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      STRENGTH: "💪",
      CARDIO: "🏃‍♂️",
      HIIT: "🔥",
      BODYWEIGHT: "🙌",
    };
    return icons[type] || "🏋️‍♂️";
  };

  const getWorkoutTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      STRENGTH: "Strength",
      CARDIO: "Cardio",
      HIIT: "HIIT",
      BODYWEIGHT: "Bodyweight",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-8 px-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100 bg-clip-text text-transparent mb-3">
            Workout Plan Generator
          </h1>
          <p className="text-zinc-400 text-lg">
            Because muscles don't grow themselves 💪
          </p>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="text-center max-w-md mx-4">
              {/* Spinner */}
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-zinc-800 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-transparent border-t-red-500 rounded-full absolute top-0 left-0 animate-spin"></div>
                <div className="w-16 h-16 border-4 border-transparent border-b-orange-500 rounded-full absolute top-4 left-4 animate-spin-reverse"></div>
                <div className="w-8 h-8 border-4 border-transparent border-r-yellow-500 rounded-full absolute top-8 left-8 animate-spin"></div>
              </div>

              <h3 className="text-xl font-semibold text-zinc-100 mb-4">
                Pumping up your workout plan...
              </h3>
              <p className="text-zinc-400 italic mb-2 transition-opacity duration-500">
                "{loadingMessage}"
              </p>
              <div className="flex justify-center space-x-1 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
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
                Tell Us About Your 💪
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-zinc-400">Ready to lift</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {errors.gender?.message && (
                    <p className="text-sm text-red-400 animate-shake">
                      ⚠️ {errors.gender.message}
                    </p>
                  )}
                </div>

                {/* Fitness Level */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-zinc-300">
                      Fitness Level
                    </label>
                    <span className="text-xs text-zinc-500">Be honest! 😉</span>
                  </div>
                  <select
                    {...register("fitnessLevel")}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                  >
                    <option value="BEGINNER">👶 Beginner</option>
                    <option value="INTERMEDIATE">👊 Intermediate</option>
                    <option value="ADVANCED">🔥 Advanced</option>
                  </select>
                  {errors.fitnessLevel?.message && (
                    <p className="text-sm text-red-400 animate-shake">
                      ⚠️ {errors.fitnessLevel.message}
                    </p>
                  )}
                </div>

                {/* Goal */}
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
                  {errors.goal?.message && (
                    <p className="text-sm text-red-400 animate-shake">
                      ⚠️ {errors.goal.message}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Workout Location
                  </label>
                  <select
                    {...register("location")}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                  >
                    <option value="HOME">🏠 Home (No excuses!)</option>
                    <option value="GYM">🏋️‍♂️ Gym (Show off time)</option>
                  </select>
                  {errors.location?.message && (
                    <p className="text-sm text-red-400 animate-shake">
                      ⚠️ {errors.location.message}
                    </p>
                  )}
                </div>

                {/* Days per week */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-zinc-300">
                      Days per Week
                    </label>
                    <span className="text-xs text-zinc-500">
                      How committed?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      {...register("daysPerWeek", { valueAsNumber: true })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 hover:border-zinc-600"
                      placeholder="4"
                    />
                    <div className="absolute right-3 top-3 text-zinc-500">
                      📅
                    </div>
                  </div>
                  {errors.daysPerWeek?.message && (
                    <p className="text-sm text-red-400 animate-shake">
                      ⚠️ {errors.daysPerWeek.message}
                    </p>
                  )}
                </div>

                {/* Workout Types - FIXED CHECKBOXES */}
                <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-zinc-300">
                      Workout Types You Prefer
                    </label>
                    <span className="text-xs text-zinc-500">
                      Pick your pain 😅
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["STRENGTH", "CARDIO", "HIIT", "BODYWEIGHT"].map(
                      (type) => {
                        const isSelected = selectedTypes.includes(type);

                        return (
                          <label
                            key={type}
                            htmlFor={`workout-type-${type}`}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.02] ${getWorkoutTypeColor(type, isSelected)}`}
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                id={`workout-type-${type}`}
                                value={type}
                                {...register("workoutTypes")}
                                className="absolute w-5 h-5 opacity-0 cursor-pointer"
                              />
                              <div
                                className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
                                  isSelected
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-zinc-600 bg-zinc-800/50"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="3"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {getWorkoutTypeIcon(type)}
                              </span>
                              <span className="text-zinc-200 text-sm font-medium">
                                {getWorkoutTypeLabel(type)}
                              </span>
                            </div>
                          </label>
                        );
                      },
                    )}
                  </div>
                  <div className="mt-3 text-xs text-zinc-500 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500/50 rounded-full"></div>
                    <span>{selectedTypes.length} of 4 selected</span>
                  </div>
                  {errors.workoutTypes?.message && (
                    <p className="text-sm text-red-400 animate-shake mt-2">
                      ⚠️ Please select at least one workout type
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-zinc-800/50">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3.5 font-medium rounded-xl transition-all duration-300 flex-1 sm:flex-none ${isValid ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700" : "bg-zinc-800 cursor-not-allowed"} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Pumping...
                      </>
                    ) : (
                      <>🏋️‍♂️ Generate Workout Plan</>
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
                    {isValid
                      ? "✓ All set! Ready to lift!"
                      : "Fill in all the details above..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isValid ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`}
                    ></div>
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
                <p className="text-red-300/80 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Dismiss this workout disaster →
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
                    Your Personalized Workout Plan 🎉
                  </h3>
                  <p className="text-zinc-400">
                    {result.plan.days.length} days • Made with ❤️ (and lots of
                    sweat)
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
                    onClick={() => downloadWorkoutPDF()}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center gap-2">
                      📥 Download PDF
                      {hasDietPlan && (
                        <span className="text-xs bg-red-700 px-2 py-1 rounded-full">
                          + Diet Plan
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
                    <div className="text-2xl">
                      {getGoalEmoji(result.plan.goal)}
                    </div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Goal
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Primary Focus</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.goal.replace("_", " ")}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Let's get those gains! 💪
                  </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">
                      {getLocationEmoji(result.plan.location)}
                    </div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Location
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Where to Workout</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.location === "GYM" ? "Gym" : "Home"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    No equipment excuses! 🏋️‍♂️
                  </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">📅</div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Schedule
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Days per Week</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.daysPerWeek}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {result.plan.daysPerWeek === 7
                      ? "No rest for the wicked!"
                      : "Rest days are important!"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 rounded-xl p-5 hover:border-zinc-600/50 transition-all duration-300 hover:scale-[1.02] group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">🏆</div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                      Level
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">Fitness Level</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {result.plan.fitnessLevel}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">You got this! 👊</p>
                </div>
              </div>

              {/* Workout Types Badges */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-zinc-100 mb-4">
                  Your Workout Types 🏋️‍♂️
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.plan.workoutTypes.map((type) => (
                    <span
                      key={type}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${getWorkoutTypeColor(type, true)}`}
                    >
                      {getWorkoutTypeIcon(type)} {getWorkoutTypeLabel(type)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workout Plan */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-zinc-100">
                    Weekly Schedule 📅
                  </h4>
                  <div className="text-sm text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                    {result.plan.days.length} workout days • Ready to sweat!
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {result.plan.days.map((day, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 p-6 transition-all duration-300 hover:border-zinc-700/50 hover:shadow-xl"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`text-sm font-medium px-3 py-1 rounded-full ${getLevelColor(result.plan.fitnessLevel)}`}
                            >
                              {day.dayLabel}
                            </span>
                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                              {getLocationEmoji(result.plan.location)}{" "}
                              {result.plan.location}
                            </span>
                          </div>
                          <h5 className="text-xl font-bold text-zinc-100 mb-2">
                            {day.focus}
                          </h5>
                          <p className="text-zinc-400 text-sm">
                            {day.exercises.length} exercises • Ready to crush
                            it! 💥
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                            {getGoalEmoji(result.plan.goal)}{" "}
                            {result.plan.goal.replace("_", " ")}
                          </span>
                          <span className="text-xs text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                            {result.plan.fitnessLevel}
                          </span>
                        </div>
                      </div>

                      {/* Warmup Section */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🔥</span>
                          <h6 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                            Warm-up
                          </h6>
                        </div>
                        <ul className="space-y-2 pl-5">
                          {day.warmup.map((w, i) => (
                            <li
                              key={i}
                              className="text-sm text-zinc-300 flex items-start gap-2"
                            >
                              <span className="text-zinc-500 mt-1">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Exercises Section */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">💪</span>
                          <h6 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                            Main Exercises ({day.exercises.length})
                          </h6>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {day.exercises.map((ex, i) => (
                            <div
                              key={i}
                              className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 transition-all duration-300 hover:border-zinc-700/50 hover:scale-[1.01]"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h6 className="font-semibold text-zinc-100 mb-1">
                                    {ex.name}
                                  </h6>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                                      {ex.muscleGroup}
                                    </span>
                                    <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                                      {ex.equipment}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-zinc-100">
                                    {ex.sets} sets
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {ex.repsOrTime}
                                  </div>
                                </div>
                              </div>
                              {ex.notes && (
                                <p className="text-xs text-zinc-400 italic mt-2">
                                  💡 {ex.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cooldown Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🧘‍♂️</span>
                          <h6 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                            Cooldown
                          </h6>
                        </div>
                        <ul className="space-y-2 pl-5">
                          {day.cooldown.map((c, i) => (
                            <li
                              key={i}
                              className="text-sm text-zinc-300 flex items-start gap-2"
                            >
                              <span className="text-zinc-500 mt-1">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pro Tips */}
                <div className="mt-8 pt-6 border-t border-zinc-800/50">
                  <div className="flex items-start gap-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-4">
                    <div className="text-2xl">💡</div>
                    <div>
                      <p className="text-zinc-300 font-medium mb-1">Pro Tip!</p>
                      <p className="text-zinc-400 text-sm">
                        Stay hydrated, listen to your body, and remember:
                        progress takes time! Don't skip warm-ups or cool-downs -
                        they prevent injuries.
                        {result.plan.goal === "MUSCLE_GAIN" &&
                          " Make sure you're eating enough protein!"}
                        {result.plan.goal === "WEIGHT_LOSS" &&
                          " Combine this with a proper diet for best results!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-zinc-500 text-sm">
                Plan ID:{" "}
                <span className="text-zinc-400 font-mono">{result.planId}</span>{" "}
                • Generated just now • Ready to transform! 🚀
              </p>
              <button
                onClick={handleReset}
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                🏋️‍♂️ Generate another plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add these styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Smooth transitions */
        * {
          transition:
            background-color 0.3s ease,
            border-color 0.3s ease;
        }

        /* Custom checkbox styles */
        input[type="checkbox"] {
          accent-color: #3b82f6; /* blue-500 */
        }

        /* Hide the native checkbox but keep it accessible */
        input[type="checkbox"].absolute {
          position: absolute;
          width: 20px;
          height: 20px;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
