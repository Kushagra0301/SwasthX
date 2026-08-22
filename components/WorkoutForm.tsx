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
  PiCheckBold,
} from "react-icons/pi";
import { WorkoutRequestSchema } from "@/lib/schemas";
import type z from "zod";
import { downloadWorkoutPDF } from "@/lib/pdf";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import {
  Field,
  FieldError,
  Choices,
  numericClass,
} from "@/components/ui/Field";

type WorkoutInput = z.input<typeof WorkoutRequestSchema>;

interface WorkoutPlanResult {
  planId: string;
  plan: {
    goal: "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
    fitnessLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    daysPerWeek: number;
    location?: "HOME" | "GYM";
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
      sparse?: boolean;
    }[];
  };
  fallbackUsed?: boolean;
  notes?: string[];
}

const LOADING_MESSAGES = [
  "Working out rest times long enough to scroll",
  "Talking your muscles into this",
  "Running out of excuses to skip leg day",
  "Mixing protein powder with optimism",
  "Counting the reps so you do not have to",
  "Briefing your sweat glands",
  "Checking you can still walk tomorrow",
];

const WORKOUT_TYPES = ["STRENGTH", "CARDIO", "HIIT", "BODYWEIGHT"] as const;

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  STRENGTH: "Strength",
  CARDIO: "Cardio",
  HIIT: "HIIT",
  BODYWEIGHT: "Bodyweight",
};

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

const GOALS = [
  { value: "WEIGHT_LOSS", label: "Lose weight" },
  { value: "MUSCLE_GAIN", label: "Gain muscle" },
  { value: "MAINTENANCE", label: "Maintain" },
] as const;

const LOCATIONS = [
  { value: "HOME", label: "At home" },
  { value: "GYM", label: "At a gym" },
] as const;

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Lose weight",
  MUSCLE_GAIN: "Gain muscle",
  MAINTENANCE: "Maintain",
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default function WorkoutForm() {
  const { showToast } = useToast();
  const reduce = useReducedMotion();
  const [result, setResult] = useState<WorkoutPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDietPlan, setHasDietPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [formStep, setFormStep] = useState<"form" | "result">("form");
  const [lastSubmitted, setLastSubmitted] = useState<WorkoutInput | null>(null);

  useEffect(() => {
    setHasDietPlan(!!localStorage.getItem("dietPlan"));
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

  const watched = watch();
  const selectedTypes = watched.workoutTypes || [];

  const onSubmit = async (data: WorkoutInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      const res = await fetch("/api/generate-workout", {
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
        setResult(json as WorkoutPlanResult);
        setFormStep("result");
        setLastSubmitted(data);
        localStorage.setItem("workoutPlan", JSON.stringify(json.plan));
        setHasDietPlan(!!localStorage.getItem("dietPlan"));
        showToast("Your workout plan is ready.", "success");
        (json.notes as string[] | undefined)?.forEach((note) =>
          showToast(note, "info")
        );
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

  const handleReset = () => {
    reset(lastSubmitted ?? undefined);
    setResult(null);
    setError(null);
    setFormStep("form");
  };

  const handleDownload = async () => {
    try {
      await downloadWorkoutPDF(showToast);
    } catch {
      // downloadWorkoutPDF already reports its own errors via toast
    }
  };

  return (
    <div>
      {loading && (
        <div className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-ink/92 px-6 backdrop-blur-md">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto h-0.5 w-40 overflow-hidden rounded-full bg-raised">
              <div className="animate-sweep h-full w-1/3 rounded-full bg-accent" />
            </div>
            <h2 className="mt-8 display-4">
              Building the week
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
          <section className="border-t border-hairline pt-8">
            <h2 className="display-4">
              Where you are starting
            </h2>
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <Choices
                  legend="Gender"
                  options={GENDERS}
                  selected={watched.gender}
                  columns={3}
                  registration={register("gender")}
                />
                <FieldError message={errors.gender?.message} />
              </div>
              <div>
                <Choices
                  legend="Fitness level"
                  hint="Be honest, the plan scales to it"
                  options={LEVELS}
                  selected={watched.fitnessLevel}
                  columns={3}
                  registration={register("fitnessLevel")}
                />
                <FieldError message={errors.fitnessLevel?.message} />
              </div>
            </div>
          </section>

          <section className="mt-12 border-t border-hairline pt-8">
            <h2 className="display-4">
              How you want to train
            </h2>
            <div className="mt-6 flex flex-col gap-6">
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

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <Choices
                    legend="Location"
                    options={LOCATIONS}
                    selected={watched.location}
                    columns={2}
                    registration={register("location")}
                  />
                  <FieldError message={errors.location?.message} />
                </div>

                <Field
                  label="Days per week"
                  htmlFor="daysPerWeek"
                  hint="1 to 7"
                  className="sm:w-36"
                >
                  <input
                    id="daysPerWeek"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={7}
                    {...register("daysPerWeek", { valueAsNumber: true })}
                    className={numericClass(!!errors.daysPerWeek)}
                    aria-invalid={!!errors.daysPerWeek}
                  />
                  <FieldError message={errors.daysPerWeek?.message} />
                </Field>
              </div>

              <fieldset>
                <div className="flex items-baseline justify-between gap-3">
                  <legend className="text-sm font-medium text-text">
                    Training styles
                  </legend>
                  <span className="tnum text-xs text-faint">
                    {selectedTypes.length} of 4
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {WORKOUT_TYPES.map((type) => {
                    const isSelected = selectedTypes.includes(type);
                    return (
                      <label
                        key={type}
                        htmlFor={`workout-type-${type}`}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-[var(--r-control)] border px-3.5 py-3 text-sm font-medium transition-colors duration-200 ${
                          isSelected
                            ? "border-[color:var(--accent-text)] bg-accent-weak text-white"
                            : "border-hairline bg-raised text-muted shadow-[var(--inset-edge)] hover:border-edge hover:text-text"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`workout-type-${type}`}
                          value={type}
                          {...register("workoutTypes")}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                            isSelected
                              ? "border-accent bg-accent text-white"
                              : "border-edge"
                          }`}
                        >
                          {isSelected && <PiCheckBold className="h-2.5 w-2.5" />}
                        </span>
                        {WORKOUT_TYPE_LABELS[type]}
                      </label>
                    );
                  })}
                </div>
                <FieldError
                  message={
                    errors.workoutTypes
                      ? "Pick at least one training style."
                      : undefined
                  }
                />
              </fieldset>
            </div>
          </section>

          <div className="mt-12 flex flex-col-reverse items-stretch gap-3 border-t border-hairline pt-8 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="sm:min-w-56"
            >
              {loading ? "Generating" : "Generate my workout plan"}
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
                Your week
              </h2>
              <p className="mt-2 text-muted">
                {GOAL_LABELS[result.plan.goal] ?? result.plan.goal},{" "}
                {result.plan.location === "GYM" ? "at a gym" : "at home"},{" "}
                <span className="tnum text-text">{result.plan.daysPerWeek}</span>{" "}
                days a week, {LEVEL_LABELS[result.plan.fitnessLevel]?.toLowerCase()}.
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
                {hasDietPlan && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    with diet
                  </span>
                )}
              </Button>
            </div>
          </div>

          {result.notes && result.notes.length > 0 && (
            <div className="mt-8 flex flex-col gap-2">
              {result.notes.map((note, i) => (
                <div key={i} className="flex items-start gap-3">
                  <PiInfoBold
                    className="mt-1 shrink-0 text-accent-text"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted">{note}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            {result.plan.workoutTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-hairline px-3.5 py-1.5 text-sm text-muted"
              >
                {WORKOUT_TYPE_LABELS[type] || type}
              </span>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-10">
            {result.plan.days.map((day, index) => (
              <motion.section
                key={index}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: reduce ? 0 : index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="border-t border-hairline pt-7"
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h3 className="display-3">
                    {day.focus}
                  </h3>
                  <span className="text-sm text-faint">{day.dayLabel}</span>
                  {day.sparse && (
                    <span className="rounded-full border border-negative/40 px-2.5 py-0.5 text-xs text-negative">
                      Fewer exercises than usual
                    </span>
                  )}
                </div>

                {day.warmup.length > 0 && (
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-6">
                    <p className="w-24 shrink-0 text-sm text-faint">Warm-up</p>
                    <p className="text-sm leading-relaxed text-muted">
                      {day.warmup.join(". ")}
                    </p>
                  </div>
                )}

                {day.exercises.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {day.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-4 rounded-[var(--r-panel)] border border-hairline bg-surface p-5 shadow-[var(--shadow-panel)]"
                      >
                        <div className="min-w-0">
                          <h4 className="font-medium text-text">{ex.name}</h4>
                          <p className="mt-1.5 text-xs text-faint">
                            {ex.muscleGroup} &middot; {ex.equipment}
                          </p>
                          {ex.notes && (
                            <p className="mt-2.5 text-xs leading-relaxed text-muted">
                              {ex.notes}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="tnum text-lg text-text">{ex.sets}</p>
                          <p className="text-xs text-faint">sets</p>
                          <p className="tnum mt-2 text-xs text-muted">
                            {ex.repsOrTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {day.cooldown.length > 0 && (
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-6">
                    <p className="w-24 shrink-0 text-sm text-faint">Cooldown</p>
                    <p className="text-sm leading-relaxed text-muted">
                      {day.cooldown.join(". ")}
                    </p>
                  </div>
                )}
              </motion.section>
            ))}
          </div>

          <div className="mt-12 flex items-start gap-3 border-t border-hairline pt-6">
            <PiInfoBold
              className="mt-1 shrink-0 text-accent-text"
              aria-hidden="true"
            />
            <p className="max-w-[68ch] text-sm leading-relaxed text-muted">
              Stay hydrated, keep the warm-up and cooldown in, and stop a set
              early if form goes.
              {result.plan.goal === "MUSCLE_GAIN" &&
                " Gaining muscle needs the protein target met on training days and rest days alike."}
              {result.plan.goal === "WEIGHT_LOSS" &&
                " Training moves the needle far less than the diet does, so pair this with the diet plan."}
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
