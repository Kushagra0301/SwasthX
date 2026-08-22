"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import {
  PiArrowLeftBold,
  PiArrowsClockwiseBold,
  PiDownloadSimpleBold,
  PiWarningCircleBold,
  PiInfoBold,
  PiSunHorizonBold,
  PiSunBold,
  PiMoonBold,
  PiCoffeeBold,
} from "react-icons/pi";
import { DietRequestSchema } from "@/lib/schemas";
import type { z } from "zod";
import { downloadDietPDF } from "@/lib/pdf";
import { useToast } from "@/components/Toast";
import { PREVIEW_KEY } from "@/components/LivePreview";
import Button from "@/components/ui/Button";
import Counter from "@/components/ui/Counter";
import {
  Field,
  FieldError,
  Choices,
  controlClass,
  numericClass,
} from "@/components/ui/Field";

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
  "Working out how many avocados that budget allows",
  "Talking your taste buds into this",
  "Measuring willpower in pizza slices",
  "Pre-approving one cheat day",
  "Making the case for broccoli",
  "Counting the calories so you do not have to",
  "Solving the coffee to water ratio",
  "Resisting the urge to just recommend pizza",
];

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
  SNACK1: "Morning snack",
  SNACK2: "Afternoon snack",
  SNACK3: "Evening snack",
};

const MEAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BREAKFAST: PiSunHorizonBold,
  LUNCH: PiSunBold,
  DINNER: PiMoonBold,
  SNACK: PiCoffeeBold,
  SNACK1: PiCoffeeBold,
  SNACK2: PiCoffeeBold,
  SNACK3: PiCoffeeBold,
};

const MEAL_ORDER = ["BREAKFAST", "SNACK1", "LUNCH", "SNACK2", "DINNER", "SNACK3", "SNACK"];

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const GOALS = [
  { value: "WEIGHT_LOSS", label: "Lose weight" },
  { value: "MUSCLE_GAIN", label: "Gain muscle" },
  { value: "MAINTENANCE", label: "Maintain" },
] as const;

const DIETS = [
  { value: "VEG", label: "Vegetarian" },
  { value: "NON_VEG", label: "Non-vegetarian" },
] as const;

const ACTIVITY = [
  { value: "SEDENTARY", label: "Sedentary" },
  { value: "LIGHT", label: "Light" },
  { value: "MODERATE", label: "Moderate" },
  { value: "VERY_ACTIVE", label: "Very active" },
  { value: "SUPER_ACTIVE", label: "Super active" },
] as const;

export default function DietForm() {
  const { showToast } = useToast();
  const reduce = useReducedMotion();
  const [result, setResult] = useState<DietPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWorkoutPlan, setHasWorkoutPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [formStep, setFormStep] = useState<"form" | "result">("form");
  const [lastSubmitted, setLastSubmitted] = useState<DietInput | null>(null);

  useEffect(() => {
    setHasWorkoutPlan(!!localStorage.getItem("workoutPlan"));
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessage(
        LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
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

  // The landing page instrument already collected these. Carry them across so
  // the visitor is not asked the same four things twice.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREVIEW_KEY);
      if (!raw) return;
      const seed = JSON.parse(raw) as Partial<DietInput>;
      if (typeof seed.age === "number") setValue("age", seed.age);
      if (typeof seed.weightKg === "number") setValue("weightKg", seed.weightKg);
      if (typeof seed.heightCm === "number") setValue("heightCm", seed.heightCm);
      if (seed.goal) setValue("goal", seed.goal);
      sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      // Nothing to carry over. Defaults stand.
    }
  }, [setValue]);

  const watched = watch();

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
        const message = json?.error || "The plan did not come back. Try again?";
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
              calories: Object.values(processedMeals).reduce(
                (sum: number, meal) => sum + (meal?.calories || 0),
                0
              ),
              protein: Object.values(processedMeals).reduce(
                (sum: number, meal) => sum + (meal?.proteinG || 0),
                0
              ),
              carbs: Object.values(processedMeals).reduce(
                (sum: number, meal) => sum + (meal?.carbsG || 0),
                0
              ),
              fat: Object.values(processedMeals).reduce(
                (sum: number, meal) => sum + (meal?.fatG || 0),
                0
              ),
            },
          })
        );

        setHasWorkoutPlan(!!localStorage.getItem("workoutPlan"));
        showToast("Your diet plan is ready.", "success");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error. Please try again.";
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

  const mealCount = result
    ? Object.values(result.meals).filter(Boolean).length
    : 0;

  return (
    <div>
      {loading && (
        <div className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-ink/92 px-6 backdrop-blur-md">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto h-0.5 w-40 overflow-hidden rounded-full bg-raised">
              <div className="animate-sweep h-full w-1/3 rounded-full bg-accent" />
            </div>
            <h2 className="mt-8 display-4">
              Running the numbers
            </h2>
            <p className="mt-3 text-muted">{loadingMessage}</p>
          </div>
        </div>
      )}

      {formStep === "form" && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="animate-rise flex flex-col"
        >
          {/* Body measurements. Sections are separated by hairlines rather
              than nested inside their own bordered panels. */}
          <section className="border-t border-hairline pt-8">
            <h2 className="display-4">
              Your measurements
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Field label="Age" htmlFor="age" hint="years">
                <input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  {...register("age", { valueAsNumber: true })}
                  className={numericClass(!!errors.age)}
                  aria-invalid={!!errors.age}
                />
                <FieldError message={errors.age?.message} />
              </Field>

              <Field label="Weight" htmlFor="weightKg" hint="kg">
                <input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  {...register("weightKg", { valueAsNumber: true })}
                  className={numericClass(!!errors.weightKg)}
                  aria-invalid={!!errors.weightKg}
                />
                <FieldError message={errors.weightKg?.message} />
              </Field>

              <Field label="Height" htmlFor="heightCm" hint="cm">
                <input
                  id="heightCm"
                  type="number"
                  inputMode="numeric"
                  {...register("heightCm", { valueAsNumber: true })}
                  className={numericClass(!!errors.heightCm)}
                  aria-invalid={!!errors.heightCm}
                />
                <FieldError message={errors.heightCm?.message} />
              </Field>
            </div>

            <div className="mt-6">
              <Choices
                legend="Gender"
                hint="Changes the BMR formula"
                options={GENDERS}
                selected={watched.gender}
                columns={3}
                registration={register("gender")}
              />
              <FieldError message={errors.gender?.message} />
            </div>
          </section>

          <section className="mt-12 border-t border-hairline pt-8">
            <h2 className="display-4">
              How you live
            </h2>
            <div className="mt-6 flex flex-col gap-6">
              <Field
                label="Activity level"
                htmlFor="activityLevel"
                hint="Movement on a typical day"
              >
                <select
                  id="activityLevel"
                  {...register("activityLevel")}
                  className={controlClass(!!errors.activityLevel)}
                >
                  {ACTIVITY.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.activityLevel?.message} />
              </Field>

              <div>
                <Choices
                  legend="Goal"
                  options={GOALS}
                  selected={watched.goal}
                  columns={3}
                  registration={register("goal")}
                />
                <FieldError message={errors.goal?.message} />
              </div>

              <div>
                <Choices
                  legend="Diet preference"
                  options={DIETS}
                  selected={watched.dietPreference}
                  columns={2}
                  registration={register("dietPreference")}
                />
                <FieldError message={errors.dietPreference?.message} />
              </div>
            </div>
          </section>

          <div className="mt-12 flex flex-col-reverse items-stretch gap-3 border-t border-hairline pt-8 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="sm:min-w-56"
            >
              {loading ? "Generating" : "Generate my diet plan"}
            </Button>
            <Button variant="ghost" size="lg" onClick={handleReset}>
              <PiArrowsClockwiseBold aria-hidden="true" />
              Reset
            </Button>
            <p className="text-sm text-faint sm:ml-auto">
              {isValid
                ? "Ready when you are."
                : "Fill in the fields above to continue."}
            </p>
          </div>
        </form>
      )}

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-[var(--r-panel)] border border-negative/40 bg-negative/[0.07] p-6"
        >
          <div className="flex items-start gap-3">
            <PiWarningCircleBold
              className="mt-0.5 shrink-0 text-xl text-negative"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-text">That did not go through</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-sm text-negative underline underline-offset-4 hover:text-text"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {result && formStep === "result" && (
        <div className="animate-rise">
          <div className="flex flex-col gap-6 border-t border-hairline pt-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="display-3">
                Your daily targets
              </h2>
              <p className="mt-2 text-muted">
                Spread across{" "}
                <span className="tnum text-text">{mealCount}</span> meals.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setFormStep("form")}>
                <PiArrowLeftBold aria-hidden="true" />
                Edit answers
              </Button>
              <Button onClick={handleDownload}>
                <PiDownloadSimpleBold aria-hidden="true" />
                Download PDF
                {hasWorkoutPlan && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    with workout
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* The headline figure gets the weight it deserves; the rest sit
              beside it on a hairline rail rather than in four equal cards. */}
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--r-panel)] border border-hairline bg-hairline lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="bg-surface p-7">
              <p className="text-sm text-muted">Calories per day</p>
              <p className="dnum mt-3 text-[2.7rem] font-bold leading-none tracking-[-0.04em] text-text">
                <Counter value={result.plan.totalCalories.min} />
                <span className="text-faint">
                  -{result.plan.totalCalories.max.toLocaleString()}
                </span>
              </p>
              <p className="mt-3 text-sm text-faint">
                Menu below totals{" "}
                <span className="tnum text-muted">
                  {result.totals?.calories ?? 0}
                </span>{" "}
                kcal
              </p>
            </div>

            {[
              {
                label: "Protein",
                range: result.plan.proteinG,
                total: result.totals?.protein,
              },
              {
                label: "Carbs",
                range: result.plan.carbsG,
                total: result.totals?.carbs,
              },
              {
                label: "Per meal",
                range: result.plan.perMeal.calories,
                unit: "kcal",
              },
            ].map((metric) => (
              <div key={metric.label} className="bg-surface p-7">
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="tnum mt-3 text-2xl font-semibold text-text">
                  {metric.range.min}
                  <span className="text-faint">-{metric.range.max}</span>
                  <span className="ml-1 text-base text-faint">
                    {metric.unit ?? "g"}
                  </span>
                </p>
                {metric.total !== undefined && (
                  <p className="mt-3 text-sm text-faint">
                    Menu totals{" "}
                    <span className="tnum text-muted">{metric.total}</span>g
                  </p>
                )}
              </div>
            ))}
          </div>

          <h3 className="mt-14 display-4">
            The day, meal by meal
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {getSortedMealKeys().map((slot, i) => {
              const meal = result.meals[slot];
              if (!meal) return null;
              const Icon = MEAL_ICONS[slot] || PiCoffeeBold;

              return (
                <motion.article
                  key={slot}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: reduce ? 0 : i * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex flex-col rounded-[var(--r-panel)] border border-hairline bg-surface p-6 shadow-[var(--shadow-panel)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <Icon className="text-accent-text" aria-hidden="true" />
                      {MEAL_LABELS[slot] || slot}
                    </span>
                    <span className="text-xs text-faint">
                      {meal.dietType === "VEG" ? "Vegetarian" : "Non-veg"}
                    </span>
                  </div>

                  <h4 className="mt-4 display-4">
                    {meal.title}
                  </h4>

                  <dl className="mt-5 flex gap-6 border-y border-hairline py-4">
                    {[
                      { k: "kcal", v: meal.calories },
                      { k: "protein", v: `${meal.proteinG}g` },
                      { k: "carbs", v: `${meal.carbsG}g` },
                    ].map((stat) => (
                      <div key={stat.k}>
                        <dt className="text-xs text-faint">{stat.k}</dt>
                        <dd className="tnum mt-1 text-base text-text">
                          {stat.v}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {meal.ingredients}
                  </p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-10 flex items-start gap-3 border-t border-hairline pt-6">
            <PiInfoBold
              className="mt-1 shrink-0 text-accent-text"
              aria-hidden="true"
            />
            <p className="max-w-[68ch] text-sm leading-relaxed text-muted">
              Drink water through the day, do not skip meals to catch up, and
              treat the band as a range rather than a target to hit exactly.
              {result.plan.totalCalories.max > 3000 &&
                " At this intake, splitting the larger portions across two sittings is easier on digestion."}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-hairline pt-6 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
            <p>
              Plan reference{" "}
              <span className="tnum text-muted">{result.planId}</span>
            </p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-muted transition-colors hover:text-text"
            >
              <PiArrowsClockwiseBold aria-hidden="true" />
              Generate another plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
