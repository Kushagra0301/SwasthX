"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WorkoutRequestSchema } from "@/lib/schemas";
import type z from "zod";
import { downloadWorkoutPDF } from "@/lib/pdf";
import { useToast } from "@/components/Toast";
import {
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
  FiTrendingDown,
  FiTrendingUp,
  FiTarget,
  FiHome,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiActivity,
  FiCheck,
} from "react-icons/fi";

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

const WORKOUT_LOADING_MESSAGES = [
  "Calculating optimal rest times for scrolling breaks...",
  "Convincing your muscles this is a good idea...",
  "Finding excuses to skip leg day...",
  "Mixing protein powder with hopes and dreams...",
  "Counting reps so you don't have to...",
  "Teaching your sweat glands to cooperate...",
  "Making sure you'll still be able to walk tomorrow...",
];

const GOAL_ICON: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>> = {
  WEIGHT_LOSS: FiTrendingDown,
  MUSCLE_GAIN: FiTrendingUp,
  MAINTENANCE: FiTarget,
};

const WORKOUT_TYPES = ["STRENGTH", "CARDIO", "HIIT", "BODYWEIGHT"] as const;

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  STRENGTH: "Strength",
  CARDIO: "Cardio",
  HIIT: "HIIT",
  BODYWEIGHT: "Bodyweight",
};

const inputClass = (hasError?: boolean) =>
  `w-full rounded-xl border ${
    hasError ? "border-danger/60" : "border-border"
  } bg-surface px-4 py-3 text-text placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent`;

export default function WorkoutForm() {
  const { showToast } = useToast();
  const [result, setResult] = useState<WorkoutPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDietPlan, setHasDietPlan] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [formStep, setFormStep] = useState<"form" | "result">("form");
  const [lastSubmitted, setLastSubmitted] = useState<WorkoutInput | null>(null);

  useEffect(() => {
    const dietPlan = localStorage.getItem("dietPlan");
    setHasDietPlan(!!dietPlan);
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessage(WORKOUT_LOADING_MESSAGES[Math.floor(Math.random() * WORKOUT_LOADING_MESSAGES.length)]);
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

  const selectedTypes = watch("workoutTypes") || [];

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
        const message = json?.error || "Our dumbbells got too heavy. Try again?";
        setError(message);
        showToast(message, "error");
      } else {
        setResult(json as WorkoutPlanResult);
        setFormStep("result");
        setLastSubmitted(data);
        localStorage.setItem("workoutPlan", JSON.stringify(json.plan));
        const dietPlan = localStorage.getItem("dietPlan");
        setHasDietPlan(!!dietPlan);
        showToast("Your workout plan is ready.", "success");
        (json.notes as string[] | undefined)?.forEach((note) => showToast(note, "info"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error - please try again.";
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
    <div className="pb-16">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm animate-fade-in">
          <div className="mx-4 max-w-md text-center">
            <div className="relative mx-auto mb-8 h-20 w-20">
              <div className="h-20 w-20 rounded-full border-4 border-surface-raised" />
              <div className="absolute top-0 left-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-accent" />
            </div>
            <h3 className="mb-3 font-display text-xl font-semibold text-text">Building your workout plan...</h3>
            <p className="italic text-text-muted">&ldquo;{loadingMessage}&rdquo;</p>
          </div>
        </div>
      )}

      {formStep === "form" && (
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 animate-slide-up">
          <h2 className="mb-8 font-display text-2xl font-semibold text-text">Tell us about your training</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Gender" htmlFor="gender">
                <select id="gender" {...register("gender")} className={inputClass(!!errors.gender)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError message={errors.gender?.message} />
              </Field>

              <Field label="Fitness level" htmlFor="fitnessLevel">
                <select id="fitnessLevel" {...register("fitnessLevel")} className={inputClass(!!errors.fitnessLevel)}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
                <FieldError message={errors.fitnessLevel?.message} />
              </Field>

              <Field label="Primary goal" htmlFor="goal">
                <select id="goal" {...register("goal")} className={inputClass(!!errors.goal)}>
                  <option value="WEIGHT_LOSS">Weight loss</option>
                  <option value="MUSCLE_GAIN">Muscle gain</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
                <FieldError message={errors.goal?.message} />
              </Field>

              <Field label="Workout location" htmlFor="location">
                <select id="location" {...register("location")} className={inputClass(!!errors.location)}>
                  <option value="HOME">Home</option>
                  <option value="GYM">Gym</option>
                </select>
                <FieldError message={errors.location?.message} />
              </Field>

              <Field label="Days per week" htmlFor="daysPerWeek" hint="1-7">
                <input
                  id="daysPerWeek"
                  type="number"
                  {...register("daysPerWeek", { valueAsNumber: true })}
                  className={inputClass(!!errors.daysPerWeek)}
                  placeholder="4"
                  aria-invalid={!!errors.daysPerWeek}
                />
                <FieldError message={errors.daysPerWeek?.message} />
              </Field>

              <div className="col-span-1 space-y-2 md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-text-muted">Workout types you prefer</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {WORKOUT_TYPES.map((type) => {
                    const isSelected = selectedTypes.includes(type);
                    return (
                      <label
                        key={type}
                        htmlFor={`workout-type-${type}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                          isSelected ? "border-accent/50 bg-accent/10 text-text" : "border-border text-text-muted hover:border-text-muted"
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
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
                            isSelected ? "border-accent bg-accent text-ink" : "border-border"
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <FiCheck className="h-3.5 w-3.5" />}
                        </span>
                        <span className="text-sm font-medium">{WORKOUT_TYPE_LABELS[type]}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-text-muted">{selectedTypes.length} of 4 selected</p>
                <FieldError message={errors.workoutTypes ? "Please select at least one workout type" : undefined} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-accent px-8 py-3.5 font-medium text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {loading ? "Generating..." : "Generate workout plan"}
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
                <h3 className="mb-2 font-display text-2xl font-semibold text-text">Your workout plan</h3>
                <p className="text-text-muted">{result.plan.days.length} days a week</p>
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
                  {hasDietPlan && <span className="rounded-full bg-ink/20 px-2 py-0.5 text-xs">+ Diet</span>}
                </button>
              </div>
            </div>

            {result.notes && result.notes.length > 0 && (
              <div className="mb-8 space-y-2">
                {result.notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-ink/40 p-4">
                    <FiInfo className="mt-0.5 flex-shrink-0 text-accent" aria-hidden="true" />
                    <p className="text-sm text-text-muted">{note}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={React.createElement(GOAL_ICON[result.plan.goal] || FiTarget, { "aria-hidden": "true" })}
                label="Goal"
                value={result.plan.goal.replace("_", " ")}
              />
              <SummaryCard
                icon={result.plan.location === "GYM" ? <FiMapPin aria-hidden="true" /> : <FiHome aria-hidden="true" />}
                label="Location"
                value={result.plan.location === "GYM" ? "Gym" : result.plan.location === "HOME" ? "Home" : "Mixed"}
              />
              <SummaryCard icon={<FiCalendar aria-hidden="true" />} label="Days per week" value={String(result.plan.daysPerWeek)} />
              <SummaryCard icon={<FiAward aria-hidden="true" />} label="Level" value={result.plan.fitnessLevel} />
            </div>

            <div className="mb-8">
              <h4 className="mb-4 text-lg font-semibold text-text">Your workout types</h4>
              <div className="flex flex-wrap gap-2">
                {result.plan.workoutTypes.map((type) => (
                  <span key={type} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text">
                    <FiActivity aria-hidden="true" /> {WORKOUT_TYPE_LABELS[type] || type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h4 className="mb-6 font-display text-xl font-semibold text-text">Weekly schedule</h4>

              <div className="grid grid-cols-1 gap-6">
                {result.plan.days.map((day, index) => (
                  <div key={index} className="rounded-2xl border border-border bg-ink/40 p-6">
                    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="mb-2 flex items-center gap-3">
                          <span className="rounded-full bg-surface-raised px-3 py-1 text-sm font-medium text-text">{day.dayLabel}</span>
                          {day.sparse && (
                            <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">Limited exercises</span>
                          )}
                        </div>
                        <h5 className="mb-2 text-xl font-bold text-text">{day.focus}</h5>
                        <p className="text-sm text-text-muted">{day.exercises.length} exercises</p>
                      </div>
                    </div>

                    {day.warmup.length > 0 && (
                      <div className="mb-6">
                        <h6 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">Warm-up</h6>
                        <ul className="space-y-2 pl-1">
                          {day.warmup.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                              <span className="mt-1 text-accent" aria-hidden="true">&bull;</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {day.exercises.length > 0 && (
                      <div className="mb-6">
                        <h6 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
                          Main exercises ({day.exercises.length})
                        </h6>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {day.exercises.map((ex, i) => (
                            <div key={i} className="rounded-xl border border-border bg-surface p-4">
                              <div className="mb-2 flex items-start justify-between">
                                <div>
                                  <h6 className="mb-1 font-semibold text-text">{ex.name}</h6>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-surface-raised px-2 py-1 text-xs text-text-muted">{ex.muscleGroup}</span>
                                    <span className="rounded-full bg-surface-raised px-2 py-1 text-xs text-text-muted">{ex.equipment}</span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <div className="text-sm font-bold text-text">{ex.sets} sets</div>
                                  <div className="text-xs text-text-muted">{ex.repsOrTime}</div>
                                </div>
                              </div>
                              {ex.notes && <p className="mt-2 text-xs italic text-text-muted">{ex.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {day.cooldown.length > 0 && (
                      <div>
                        <h6 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">Cooldown</h6>
                        <ul className="space-y-2 pl-1">
                          {day.cooldown.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                              <span className="mt-1 text-accent" aria-hidden="true">&bull;</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-ink/40 p-4">
                <FiInfo className="mt-0.5 flex-shrink-0 text-accent" aria-hidden="true" />
                <p className="text-sm text-text-muted">
                  Stay hydrated, listen to your body, and don&rsquo;t skip warm-ups or cool-downs - they prevent
                  injuries.
                  {result.plan.goal === "MUSCLE_GAIN" && " Make sure you're eating enough protein."}
                  {result.plan.goal === "WEIGHT_LOSS" && " Combine this with a proper diet for best results."}
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

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-ink/40 p-5">
      <div className="mb-3 text-lg text-accent">{icon}</div>
      <p className="mb-1 text-sm text-text-muted">{label}</p>
      <p className="text-2xl font-semibold capitalize text-text">{value.toLowerCase()}</p>
    </div>
  );
}
