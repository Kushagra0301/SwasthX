import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          SwasthX
        </h1>

        <p className="mt-4 text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto">
          Get a <span className="text-white font-medium">personalized diet & workout plan</span>{" "}
          in under 60 seconds.
          <br className="hidden md:block" />
          No login. No OTP. Completely free.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/questionnaires/diet"
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-semibold text-lg"
          >
            Generate Diet Plan
          </Link>

          <Link
            href="/questionnaires/workout"
            className="px-8 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition font-semibold text-lg border border-zinc-700"
          >
            Generate Workout Plan
          </Link>
        </div>

        {/* TRUST STRIP */}
        <p className="mt-6 text-sm text-zinc-400">
          ✔ Free • ✔ Instant • ✔ Downloadable PDF • ✔ Made For the Community By Kushagra
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            step="01"
            title="Answer Simple Questions"
            desc="Age, weight, goal, activity level — nothing complicated."
          />
          <FeatureCard
            step="02"
            title="Get Your Plan Instantly"
            desc="Diet calories, macros, workouts — generated in seconds."
          />
          <FeatureCard
            step="03"
            title="Download & Follow"
            desc="Save the PDF. Share it. Follow it daily."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        Built with ❤️ for people who want results, not confusion.
      </footer>
    </main>
  );
}

/* ---------- Small reusable card ---------- */
function FeatureCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-blue-500 font-semibold mb-2">Step {step}</p>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{desc}</p>
    </div>
  );
}
