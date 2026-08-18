"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DietRequestSchema } from "../lib/schemas";
import type { z } from "zod";
import { downloadDietPDF } from "@/lib/pdf";
import { useToast } from "@/components/Toast";
import {
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiDroplet,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
  FiSunrise,
  FiSun,
  FiMoon,
  FiCoffee,
} from "react-icons/fi";

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
  planId: string;
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

const LOADING_MESSAGES = [
  "Calculating how many avocados you can afford...",
  "Convincing your taste buds this will be fine...",
  "Measuring willpower in pizza slices...",
  "Finding excuses for cheat days...",
  "Pretending broccoli tastes good...",
  "Counting calories so you don't have to...",
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
  SNACK3: "Evening Snack",
};

const MEAL_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  BREAKFAST: FiSunrise,
  LUNCH: FiSun,
  DINNER: FiMoon,
  SNACK: FiCoffee,
  SNACK1: FiCoffee,
  SNACK2: FiCoffee,
  SNACK3: FiCoffee,
};

const MEAL_ORDER = ["BREAKFAST", "SNACK1", "LUNCH", "SNACK2", "DINNER", "SNACK3", "SNACK"];

const inputClass = (hasError?: boolean) =>
  `w-full rounded-xl border ${
    hasError ? "border-danger/60" : "border-border"
  } bg-surface px-4 py-3 text-text placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`;

export default function DietForm() {
  const { showToast } = useToast();
  const [result, setResult] = useState<DietPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWorkoutPlan, setHasWorkoutPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [formStep, setFormStep] = useState<"form" | "result">("form");
  const [lastSubmitted, setLastSubmitted] = useState<DietInput | null>(null);

  useEffect(() => {
    const workoutPlan = localStorage.getItem("workoutPlan");
    setHasWorkoutPlan(!!workoutPlan);
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
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
      dietPreference: "NON_VEG",
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
      if (!res.ok || !json.ok) {
        const message = json?.error || "Our food processor overheated. Try again?";
        setError(message);
        showToast(message, "error");
      } else {
        const processedMeals = processMealsData(json.meals);
        const updatedResult = { ...json, meals: processedMeals };

        setResult(updatedResult);
        setFormStep("result");
        setLastSubmitted(data);

        localStorage.setItem(
          "dietPlan",
          JSON.stringify({
            ...json.plan,
            meals: processedMeals,
            totals: json.totals || {
              calories: Object.values(processedMeals).reduce((sum: number, meal) => sum + (meal?.calories || 0), 0),
              protein: Object.values(processedMeals).reduce((sum: number, meal) => sum + (meal?.proteinG || 0), 0),
              carbs: Object.values(processedMeals).reduce((sum: number, meal) => sum + (meal?.carbsG || 0), 0),
              fat: Object.values(processedMeals).reduce((sum: number, meal) => sum + (meal?.fatG || 0), 0),
            },
          })
        );

        const workoutPlan = localStorage.getItem("workoutPlan");
        setHasWorkoutPlan(!!workoutPlan);
        showToast("Your diet plan is ready.", "success");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error - please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const processMealsData = (meals: Record<string, MealBlock | null>) => {
    const processed: Record<string, MealBlock | null> = {};

    // True whenever the extended 5- or 6-meal structure was used, since both
    // include at least SNACK1.
    const hasExtendedMealPlan = meals.SNACK1 || meals.SNACK2 || meals.SNACK3;

    if (hasExtendedMealPlan) {
      MEAL_ORDER.forEach((key) => {
        if (meals[key] !== undefined) {
          processed[key] = meals[key];
        }
      });
    } else {
      processed.BREAKFAST = meals.BREAKFAST || null;
      processed.LUNCH = meals.LUNCH || null;
      processed.DINNER = meals.DINNER || null;
      processed.SNACK1 = meals.SNACK || null;
      processed.SNACK2 = null;
      processed.SNACK3 = null;
    }

    return processed;
  };

  const handleReset = () => {
    reset(lastSubmitted ?? undefined);
    setResult(null);
    setError(null);
    setFormStep("form");
  };

  const getSortedMealKeys = () => {
    if (!result?.meals) return [];
    return Object.keys(result.meals)
      .sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
      .filter((key) => result.meals[key] !== null);
  };

  const handleDownload = async () => {
    try {
      await downloadDietPDF(showToast);
    } catch {
      // downloadDietPDF already reports its own errors via toast
    }
  };

  return (
    <div className="pb-16">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm animate-fade-in">
          <div className="mx-4 max-w-md text-center">
            <div className="relative mx-auto mb-8 h-20 w-20">
              <div className="h-20 w-20 rounded-full border-4 border-surface-raised" />
              <div className="absolute top-0 left-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-accent" />
            </div>
            <h3 className="mb-3 font-display text-xl font-semibold text-text">Building your diet plan...</h3>
            <p className="italic text-text-muted">&ldquo;{loadingMessage}&rdquo;</p>
          </div>
        </div>
      )}

      {formStep === "form" && (
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 animate-slide-up">
          <h2 className="mb-8 font-display text-2xl font-semibold text-text">Tell us about yourself</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Age" htmlFor="age" hint="Years">
                <input
                  id="age"
                  type="number"
                  {...register("age", { valueAsNumber: true })}
                  className={inputClass(!!errors.age)}
                  placeholder="25"
                  aria-invalid={!!errors.age}
                />
                <FieldError message={errors.age?.message} />
              </Field>

              <Field label="Gender" htmlFor="gender">
                <select id="gender" {...register("gender")} className={inputClass(!!errors.gender)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError message={errors.gender?.message} />
              </Field>

              <Field label="Weight" htmlFor="weightKg" hint="kg">
                <input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  {...register("weightKg", { valueAsNumber: true })}
                  className={inputClass(!!errors.weightKg)}
                  placeholder="70"
                  aria-invalid={!!errors.weightKg}
                />
                <FieldError message={errors.weightKg?.message} />
              </Field>

              <Field label="Height" htmlFor="heightCm" hint="cm">
                <input
                  id="heightCm"
                  type="number"
                  {...register("heightCm", { valueAsNumber: true })}
                  className={inputClass(!!errors.heightCm)}
                  placeholder="175"
                  aria-invalid={!!errors.heightCm}
                />
                <FieldError message={errors.heightCm?.message} />
              </Field>

              <Field label="Activity level" htmlFor="activityLevel">
                <select id="activityLevel" {...register("activityLevel")} className={inputClass(!!errors.activityLevel)}>
                  <option value="SEDENTARY">Sedentary</option>
                  <option value="LIGHT">Light</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="VERY_ACTIVE">Very active</option>
                  <option value="SUPER_ACTIVE">Super active</option>
                </select>
                <FieldError message={errors.activityLevel?.message} />
              </Field>

              <Field label="Primary goal" htmlFor="goal">
                <select id="goal" {...register("goal")} className={inputClass(!!errors.goal)}>
                  <option value="WEIGHT_LOSS">Weight loss</option>
                  <option value="MUSCLE_GAIN">Muscle gain</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
                <FieldError message={errors.goal?.message} />
              </Field>

              <Field label="Diet preference" htmlFor="dietPreference">
                <select id="dietPreference" {...register("dietPreference")} className={inputClass(!!errors.dietPreference)}>
                  <option value="VEG">Vegetarian</option>
                  <option value="NON_VEG">Non-vegetarian</option>
                </select>
                <FieldError message={errors.dietPreference?.message} />
              </Field>
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-accent px-8 py-3.5 font-medium text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {loading ? "Generating..." : "Generate diet plan"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-8 py-3.5 font-medium text-text-muted transition-colors hover:border-text-muted hover:text-text sm:flex-none"
              >
                <FiRefreshCw aria-hidden="true" /> Reset
              </button>
            </div>

            <p className="text-sm text-text-muted">
              {isValid ? "All set - ready to generate." : "Fill in the details above to continue."}
            </p>
          </form>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 flex-shrink-0 text-xl text-danger" aria-hidden="true" />
            <div>
              <p className="mb-1 font-medium text-text">Something went wrong</p>
              <p className="text-sm text-text-muted">{error}</p>
              <button onClick={() => setError(null)} className="mt-3 text-sm text-danger hover:underline">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {result && formStep === "result" && (
        <div className="space-y-8 animate-slide-up">
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="mb-2 font-display text-2xl font-semibold text-text">Your diet plan</h3>
                <p className="text-text-muted">{Object.values(result.meals).filter(Boolean).length} meals a day</p>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <button
                  onClick={() => setFormStep("form")}
                  className="w-full rounded-xl border border-border px-6 py-3 font-medium text-text-muted transition-colors hover:border-text-muted hover:text-text sm:w-auto"
                >
                  Edit details
                </button>
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-medium text-ink transition-colors hover:brightness-95 sm:w-auto"
                >
                  <FiDownload aria-hidden="true" />
                  Download PDF
                  {hasWorkoutPlan && <span className="rounded-full bg-ink/20 px-2 py-0.5 text-xs">+ Workout</span>}
                </button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={<FiZap aria-hidden="true" />} label="Calories" value={`${result.plan.totalCalories.min}-${result.plan.totalCalories.max}`} sub={`Total: ${result.totals?.calories || 0} kcal`} />
              <SummaryCard icon={<FiTarget aria-hidden="true" />} label="Per meal" value={`${result.plan.perMeal.calories.min}-${result.plan.perMeal.calories.max}`} sub={`${Object.values(result.meals).filter(Boolean).length} meals`} />
              <SummaryCard icon={<FiTrendingUp aria-hidden="true" />} label="Protein" value={`${result.plan.proteinG.min}-${result.plan.proteinG.max}g`} sub={`Total: ${result.totals?.protein || 0}g`} />
              <SummaryCard icon={<FiDroplet aria-hidden="true" />} label="Carbs" value={`${result.plan.carbsG.min}-${result.plan.carbsG.max}g`} sub={`Total: ${result.totals?.carbs || 0}g`} />
            </div>

            <div className="mt-10">
              <h4 className="mb-6 font-display text-xl font-semibold text-text">Today&rsquo;s menu</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getSortedMealKeys().map((slot) => {
                  const meal = result.meals[slot];
                  if (!meal) return null;
                  const Icon = MEAL_ICONS[slot] || FiCoffee;

                  return (
                    <div key={slot} className="rounded-xl border border-border bg-ink/40 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 text-sm font-medium text-text">
                          <Icon aria-hidden="true" /> {MEAL_LABELS[slot] || slot}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            meal.dietType === "VEG" ? "bg-secondary/15 text-secondary" : "bg-accent/15 text-accent"
                          }`}
                        >
                          {meal.dietType === "VEG" ? "Vegetarian" : "Non-veg"}
                        </span>
                      </div>

                      <h5 className="mb-3 text-lg font-semibold text-text">{meal.title}</h5>

                      <div className="mb-4 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-surface-raised px-3 py-1 text-text">{meal.calories} kcal</span>
                        <span className="rounded-full bg-surface-raised px-3 py-1 text-text">{meal.proteinG}g protein</span>
                        <span className="rounded-full bg-surface-raised px-3 py-1 text-text">{meal.carbsG}g carbs</span>
                      </div>

                      <div className="border-t border-border pt-4 text-sm leading-relaxed text-text-muted">
                        {meal.ingredients}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-ink/40 p-4">
                <FiInfo className="mt-0.5 flex-shrink-0 text-accent" aria-hidden="true" />
                <p className="text-sm text-text-muted">
                  Drink plenty of water, don&rsquo;t skip meals, and remember: consistency beats perfection.
                  {result.plan.totalCalories.max > 3000 && " You might want to split those larger portions."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-text-muted">
              Plan ID: <span className="font-mono text-text">{result.planId}</span>
            </p>
            <button onClick={handleReset} className="flex items-center gap-1 text-sm text-text-muted hover:text-text">
              <FiRefreshCw aria-hidden="true" /> Generate another plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-text-muted">
          {label}
        </label>
        {hint && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-sm text-danger">
      <FiAlertCircle aria-hidden="true" /> {message}
    </p>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-ink/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-lg text-accent">{icon}</span>
      </div>
      <p className="mb-1 text-sm text-text-muted">{label}</p>
      <p className="text-2xl font-semibold text-text">{value}</p>
      <p className="mt-2 text-xs text-text-muted">{sub}</p>
    </div>
  );
}
