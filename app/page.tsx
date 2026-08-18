"use client";

import {
  FiZap,
  FiDownload,
  FiHeart,
  FiActivity,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiEdit,
} from "react-icons/fi";
import { useDisclaimer } from "@/components/DisclaimerProvider";
import MagneticButton from "@/components/MagneticButton";
import CurvedLoop from "@/components/CurvedLoop";
import SpotlightCard from "@/components/SpotlightCard";

export default function Page() {
  const { navigateWithDisclaimer } = useDisclaimer();

  return (
    <main className="text-text">
      {/* HERO */}
      <section className="grid grid-cols-1 gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
            Diet &amp; workout planning
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] text-text md:text-6xl">
            A plan built around your body, not a template.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
            Get a personalized diet and workout plan in under 60 seconds. No login, no OTP, no busywork -
            just a plan you can start following today.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <MagneticButton>
              <button
                onClick={() => navigateWithDisclaimer("/questionnaires/diet")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 font-semibold text-ink transition-colors hover:bg-accent-hover"
              >
                <FiHeart aria-hidden="true" />
                Generate diet plan
              </button>
            </MagneticButton>
            <MagneticButton>
              <button
                onClick={() => navigateWithDisclaimer("/questionnaires/workout")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-8 py-4 font-semibold text-text transition-colors hover:border-secondary hover:text-secondary"
              >
                <FiActivity aria-hidden="true" />
                Generate workout plan
              </button>
            </MagneticButton>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <FiShield className="text-secondary" aria-hidden="true" /> No sign-up required
            </span>
            <span className="flex items-center gap-2">
              <FiUsers className="text-secondary" aria-hidden="true" /> Built for real people
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 self-start rounded-2xl border border-border bg-surface p-6 md:mt-4">
          <Stat value="100%" label="Free" />
          <Stat value="60s" label="Time to plan" />
          <Stat value="PDF" label="Downloadable" />
          <Stat value="0" label="Logins needed" />
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border py-6 text-text-muted">
        <CurvedLoop marqueeText="Personalized ✦ Instant ✦ Private ✦ Free forever ✦" speed={0.6} curveAmount={90} />
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border py-20">
        <div className="mb-12 max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">How it works</h2>
          <p className="mt-3 text-text-muted">Three steps between you and a plan you can actually follow.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <StepCard
            step="01"
            icon={<FiEdit aria-hidden="true" />}
            title="Answer a few questions"
            desc="Age, weight, goal, activity level - nothing complicated. It takes less than a minute."
          />
          <StepCard
            step="02"
            icon={<FiZap aria-hidden="true" />}
            title="Get your plan instantly"
            desc="Calories, macros, and workouts calculated for your exact numbers - generated in seconds."
          />
          <StepCard
            step="03"
            icon={<FiDownload aria-hidden="true" />}
            title="Download and follow"
            desc="Save it as a PDF, keep it on your phone, and follow it daily."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border py-20">
        <div className="mb-12 max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-text md:text-4xl">Why SwasthX</h2>
          <p className="mt-3 text-text-muted">Everything you need for a plan that fits your life.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureItem
            icon={<FiHeart aria-hidden="true" />}
            title="Personalized nutrition"
            desc="Custom meal plans based on your goals, preferences, and lifestyle."
          />
          <FeatureItem
            icon={<FiActivity aria-hidden="true" />}
            title="Smart workouts"
            desc="Exercise routines that adapt to your fitness level and available equipment."
          />
          <FeatureItem
            icon={<FiTrendingUp aria-hidden="true" />}
            title="Clear targets"
            desc="Calories and macros you can track, with sensible, science-based ranges."
          />
          <FeatureItem
            icon={<FiActivity aria-hidden="true" />}
            title="Flexible plans"
            desc="Home or gym. Vegetarian or non-veg. Built to fit around you."
          />
          <FeatureItem
            icon={<FiUsers aria-hidden="true" />}
            title="Community driven"
            desc="Built for real people, by real people - no corporate fluff."
          />
          <FeatureItem
            icon={<FiShield aria-hidden="true" />}
            title="Privacy first"
            desc="No data selling, no spam - just a tool that does its job."
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border py-20">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center md:p-14">
          <h3 className="font-display text-3xl font-semibold text-text md:text-4xl">Ready to start?</h3>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Join the people who've already started their health journey with SwasthX. It's free, instant,
            and actually works.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <MagneticButton>
              <button
                onClick={() => navigateWithDisclaimer("/questionnaires/diet")}
                className="rounded-xl bg-accent px-8 py-4 font-semibold text-ink transition-colors hover:bg-accent-hover"
              >
                Start with diet
              </button>
            </MagneticButton>
            <MagneticButton>
              <button
                onClick={() => navigateWithDisclaimer("/questionnaires/workout")}
                className="rounded-xl border border-border px-8 py-4 font-semibold text-text transition-colors hover:border-secondary hover:text-secondary"
              >
                Start with workout
              </button>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 text-center">
        <p className="text-lg text-text-muted">
          Built for people who want <span className="text-secondary">results</span>, not confusion.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-text-muted sm:flex-row sm:gap-4">
          <span>&copy; {new Date().getFullYear()} SwasthX. All rights reserved.</span>
          <span className="hidden sm:inline">&bull;</span>
          <span>Made by Kushagra</span>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-ink/40 p-4">
      <div className="font-display text-2xl font-semibold text-accent">{value}</div>
      <div className="text-sm text-text-muted">{label}</div>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <SpotlightCard className="rounded-2xl border border-border bg-surface p-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-display text-3xl font-semibold text-text-muted">{step}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg text-accent">
          {icon}
        </span>
      </div>
      <h3 className="mb-2 text-xl font-semibold text-text">{title}</h3>
      <p className="text-text-muted leading-relaxed">{desc}</p>
    </SpotlightCard>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <SpotlightCard className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-lg text-secondary">
          {icon}
        </span>
        <h4 className="font-semibold text-text">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-text-muted">{desc}</p>
    </SpotlightCard>
  );
}
