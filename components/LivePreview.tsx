"use client";

// The hero visual is the product itself, not a picture of it. Every number
// below comes from lib/tdee.ts, the same function the diet route uses, so what
// the visitor drags here is the arithmetic they will get on the next page.

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PiArrowRightBold } from "react-icons/pi";
import { buildDietPlan, type FitnessGoal } from "@/lib/tdee";
import { useDisclaimer } from "@/components/DisclaimerProvider";
import Button from "@/components/ui/Button";

const GOALS: { value: FitnessGoal; label: string }[] = [
  { value: "WEIGHT_LOSS", label: "Lose" },
  { value: "MAINTENANCE", label: "Maintain" },
  { value: "MUSCLE_GAIN", label: "Gain" },
];

/** Carried to the diet form so the visitor is not asked the same things twice. */
export const PREVIEW_KEY = "sx:preview";

function Slider({
  id,
  label,
  unit,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-muted">
          {label}
        </label>
        <span className="tnum text-sm text-text">
          {value}
          <span className="ml-1 text-faint">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink
          [&::-webkit-slider-thumb]:bg-[color:var(--accent-text)]
          [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink
          [&::-moz-range-thumb]:bg-[color:var(--accent-text)]"
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--hairline) ${pct}%)`,
        }}
      />
    </div>
  );
}

export default function LivePreview() {
  const { navigateWithDisclaimer } = useDisclaimer();
  const reduce = useReducedMotion();

  const [weightKg, setWeightKg] = useState(72);
  const [heightCm, setHeightCm] = useState(174);
  const [age, setAge] = useState(28);
  const [goal, setGoal] = useState<FitnessGoal>("WEIGHT_LOSS");

  const plan = useMemo(
    () =>
      buildDietPlan({
        age,
        gender: "MALE",
        weightKg,
        heightCm,
        activityLevel: "MODERATE",
        goal,
      }),
    [age, weightKg, heightCm, goal]
  );

  // Midpoint grams, converted to the share of energy each macro carries.
  const protein = (plan.proteinG.min + plan.proteinG.max) / 2;
  const carbs = (plan.carbsG.min + plan.carbsG.max) / 2;
  const fat = (plan.fatG.min + plan.fatG.max) / 2;
  const energy = protein * 4 + carbs * 4 + fat * 9;
  const split = [
    { key: "Protein", grams: protein, share: (protein * 4) / energy, tone: "var(--accent)" },
    { key: "Carbs", grams: carbs, share: (carbs * 4) / energy, tone: "#7ba3ff" },
    { key: "Fat", grams: fat, share: (fat * 9) / energy, tone: "#bcccea" },
  ];

  const handOff = () => {
    try {
      sessionStorage.setItem(
        PREVIEW_KEY,
        JSON.stringify({ age, weightKg, heightCm, goal })
      );
    } catch {
      // Private mode or storage disabled. The form falls back to its defaults.
    }
    navigateWithDisclaimer("/questionnaires/diet");
  };

  return (
    <div className="rounded-[var(--r-panel)] border border-hairline bg-surface p-5 shadow-[var(--shadow-lift)] sm:p-6">
      <div className="flex items-baseline justify-between border-b border-hairline pb-4">
        <p className="text-sm text-muted">Your daily target</p>
        <p className="text-sm text-faint">Moderate activity</p>
      </div>

      <div className="flex items-end gap-2 py-5">
        <motion.span
          key={`${plan.totalCalories.min}-${plan.totalCalories.max}`}
          initial={reduce ? false : { opacity: 0.45 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="dnum text-[2.9rem] font-bold leading-none tracking-[-0.04em] text-text"
        >
          {plan.totalCalories.min.toLocaleString()}
        </motion.span>
        <span className="dnum pb-2 text-xl text-faint">
          -{plan.totalCalories.max.toLocaleString()}
        </span>
        <span className="pb-2.5 text-sm text-muted">kcal</span>
      </div>

      <div className="flex h-2 w-full overflow-hidden rounded-full bg-raised">
        {split.map((macro) => (
          <motion.div
            key={macro.key}
            animate={{ width: `${macro.share * 100}%` }}
            initial={false}
            transition={
              reduce ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
            }
            style={{ background: macro.tone }}
          />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-4 border-b border-hairline pb-5">
        {split.map((macro) => (
          <div key={macro.key} className="flex flex-col gap-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ background: macro.tone }}
              />
              {macro.key}
            </dt>
            <dd className="tnum text-lg text-text">
              {Math.round(macro.grams)}
              <span className="ml-0.5 text-sm text-faint">g</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3.5 pt-5">
        <Slider
          id="pv-weight"
          label="Weight"
          unit="kg"
          min={40}
          max={160}
          value={weightKg}
          onChange={setWeightKg}
        />
        <Slider
          id="pv-height"
          label="Height"
          unit="cm"
          min={140}
          max={210}
          value={heightCm}
          onChange={setHeightCm}
        />
        <Slider
          id="pv-age"
          label="Age"
          unit="yrs"
          min={14}
          max={80}
          value={age}
          onChange={setAge}
        />

        <fieldset className="mt-1">
          <legend className="mb-2 text-sm text-muted">Goal</legend>
          <div className="grid grid-cols-3 gap-2">
            {GOALS.map((option) => {
              const active = goal === option.value;
              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-[var(--r-control)] border py-2 text-center text-sm transition-colors duration-200 ${
                    active
                      ? "border-[color:var(--accent-text)] bg-accent-weak text-white"
                      : "border-hairline text-muted hover:border-edge hover:text-text"
                  }`}
                >
                  <input
                    type="radio"
                    name="preview-goal"
                    value={option.value}
                    checked={active}
                    onChange={() => setGoal(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <Button size="lg" className="mt-5 w-full" onClick={handOff}>
        Continue with these numbers
        <PiArrowRightBold aria-hidden="true" />
      </Button>
    </div>
  );
}
