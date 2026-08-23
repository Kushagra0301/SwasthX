"use client";

import Link from "next/link";
import {
  PiArrowRightBold,
  PiBarbellBold,
  PiForkKnifeBold,
  PiFilePdfBold,
  PiLockKeyBold,
} from "react-icons/pi";
import { useDisclaimer } from "@/components/DisclaimerProvider";
import LivePreview from "@/components/LivePreview";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import MagneticButton from "@/components/MagneticButton";

const DIET_OUTPUTS = [
  "A calorie band, not a single brittle number",
  "Protein, carbs and fat in grams per day",
  "A named dish for every meal slot, with its ingredients",
  "Vegetarian or non-vegetarian throughout",
];

const WORKOUT_OUTPUTS = [
  "One to seven training days, laid out across the week",
  "A focus and an exercise list for each day",
  "Sets and reps or a duration on every movement",
  "Warm-up and cooldown written into each session",
];

const MEAL_SLOTS = [
  { time: "07:30", slot: "Breakfast" },
  { time: "11:00", slot: "Morning snack" },
  { time: "13:30", slot: "Lunch" },
  { time: "17:00", slot: "Afternoon snack" },
  { time: "20:30", slot: "Dinner" },
];

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TRAINING_DAYS = [0, 1, 3, 5];

export default function Page() {
  const { navigateWithDisclaimer } = useDisclaimer();

  return (
    <main>
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-5 pb-20 pt-24 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28">
        <div className="lg:pt-6">
          <h1 className="max-w-[13ch] display-1">
            Built from your numbers.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted">
            Answer six questions. Get calorie targets, macros and meals, or a
            weekly training split, and a PDF to keep.
          </p>

          <div className="mt-8">
            <MagneticButton className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigateWithDisclaimer("/questionnaires/workout")}
              >
                <PiBarbellBold aria-hidden="true" />
                Build a workout plan instead
              </Button>
            </MagneticButton>
          </div>
        </div>

        <Reveal delay={0.1}>
          <LivePreview />
        </Reveal>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-hairline md:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="bg-ink px-5 py-16 md:px-10 lg:py-20">
            <div className="mb-7 flex items-center gap-3">
              <PiForkKnifeBold
                className="text-2xl text-accent-text"
                aria-hidden="true"
              />
              <h2 className="display-3">
                The diet plan
              </h2>
            </div>
            <ul className="flex flex-col">
              {DIET_OUTPUTS.map((line) => (
                <li
                  key={line}
                  className="border-b border-hairline py-4 text-muted first:border-t"
                >
                  {line}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigateWithDisclaimer("/questionnaires/diet")}
              className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-accent-text transition-colors hover:text-white"
            >
              Answer the diet questions
              <PiArrowRightBold
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>
          </Reveal>

          <Reveal delay={0.08} className="bg-ink px-5 py-16 md:px-10 lg:py-20">
            <div className="mb-7 flex items-center gap-3">
              <PiBarbellBold
                className="text-2xl text-accent-text"
                aria-hidden="true"
              />
              <h2 className="display-3">
                The workout plan
              </h2>
            </div>
            <ul className="flex flex-col">
              {WORKOUT_OUTPUTS.map((line) => (
                <li
                  key={line}
                  className="border-b border-hairline py-4 text-muted first:border-t"
                >
                  {line}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigateWithDisclaimer("/questionnaires/workout")}
              className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-accent-text transition-colors hover:text-white"
            >
              Answer the workout questions
              <PiArrowRightBold
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-hairline bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-28">
          <h2 className="mb-14 max-w-[16ch] display-3">
            Three minutes, start to PDF.
          </h2>
          <div className="grid grid-cols-1 gap-px bg-hairline md:grid-cols-3">
            {[
              {
                verb: "Answer",
                body: "Age, weight, height, activity, goal, preference. Nothing that does not change the arithmetic.",
              },
              {
                verb: "Generate",
                body: "Your figures run through a TDEE calculation and come back as targets, meals or a weekly split.",
              },
              {
                verb: "Download",
                body: "Export a PDF. Build both plans and the export carries the diet and the training together.",
              },
            ].map((step, i) => (
              <Reveal
                key={step.verb}
                delay={i * 0.07}
                className="bg-ink px-6 py-9 md:px-8"
              >
                <h3 className="display-4">
                  {step.verb}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-28">
          <h2 className="mb-12 max-w-[18ch] display-3">
            What lands in the file.
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Reveal className="rounded-[var(--r-panel)] border border-hairline bg-surface p-7 shadow-[var(--shadow-panel)] lg:col-span-2">
              <h3 className="display-4">
                A day with every slot filled
              </h3>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
                Depending on your intake the plan runs four to six eating
                occasions. Each one arrives with a dish and its ingredients, not
                a macro target to solve yourself.
              </p>
              <ol className="mt-7 flex flex-col">
                {MEAL_SLOTS.map((meal) => (
                  <li
                    key={meal.slot}
                    className="flex items-center gap-5 border-t border-hairline py-3 last:border-b"
                  >
                    <span className="tnum w-14 shrink-0 text-sm text-faint">
                      {meal.time}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span className="text-sm text-text">{meal.slot}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal
              delay={0.06}
              className="flex flex-col rounded-[var(--r-panel)] border border-hairline bg-surface p-7 shadow-[var(--shadow-panel)]"
            >
              <h3 className="display-4">
                A week you can read at a glance
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pick one to seven days. The plan places them and names the focus
                for each.
              </p>
              <div className="mt-auto grid grid-cols-7 gap-1.5 pt-8">
                {WEEK.map((day, i) => {
                  const training = TRAINING_DAYS.includes(i);
                  return (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <span className="text-[0.65rem] uppercase text-faint">
                        {day.slice(0, 1)}
                      </span>
                      <span
                        className={`h-9 w-full rounded-[4px] ${
                          training ? "bg-accent" : "bg-raised"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-faint">
                Four days shown as an example.
              </p>
            </Reveal>

            <Reveal
              delay={0.1}
              className="rounded-[var(--r-panel)] border border-hairline bg-[linear-gradient(150deg,rgb(47_107_255/0.14),transparent_62%)] p-7 shadow-[var(--shadow-panel)]"
            >
              <PiLockKeyBold
                className="text-2xl text-accent-text"
                aria-hidden="true"
              />
              <h3 className="mt-5 display-4">
                Nothing to sign up for
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                No account, no email, no verification code. Your plan is held in
                your own browser and the tab is the whole session.
              </p>
            </Reveal>

            <Reveal
              delay={0.14}
              className="rounded-[var(--r-panel)] border border-hairline bg-surface p-7 shadow-[var(--shadow-panel)] lg:col-span-2"
            >
              <PiFilePdfBold
                className="text-2xl text-accent-text"
                aria-hidden="true"
              />
              <h3 className="mt-5 display-4">
                One PDF, both plans
              </h3>
              <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-muted">
                Generate a diet plan and a workout plan in the same visit and the
                export merges them into a single document, so the food and the
                training arrive on your phone together.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-28">
          <div className="max-w-[68ch]">
            <h2 className="display-3">
              What this is not.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              SwasthX is a calculator with a good memory for recipes. It is not
              medical advice, and it does not know about your medication, your
              injuries, your allergies or your bloodwork.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Read the plan as a starting point and take it to a doctor,
              dietitian or trainer before you commit to it, especially if you are
              managing a condition, pregnant, or coming back from an injury.
              Outcomes vary with genetics, sleep, stress and consistency, and
              none of those are inputs on the form.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8 lg:py-32">
          <h2 className="mx-auto max-w-[16ch] display-2">
            Start with whichever you will actually do.
          </h2>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <MagneticButton className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigateWithDisclaimer("/questionnaires/diet")}
              >
                <PiForkKnifeBold aria-hidden="true" />
                Build a diet plan
              </Button>
            </MagneticButton>
            <MagneticButton className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigateWithDisclaimer("/questionnaires/workout")}
              >
                <PiBarbellBold aria-hidden="true" />
                Build a workout plan
              </Button>
            </MagneticButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-faint md:flex-row md:items-center md:justify-between md:px-8">
          <Link
            href="/"
            className="font-display text-base font-bold tracking-[-0.03em] text-muted transition-colors hover:text-text"
          >
            Swasth<span className="text-accent-text">X</span>
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <span>{new Date().getFullYear()} SwasthX</span>
            <span>Informational only, not medical advice</span>
            <span>Made by Kushagra</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
