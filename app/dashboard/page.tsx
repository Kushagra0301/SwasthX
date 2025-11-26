// app/dashboard/page.tsx

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Dashboard — SwasthX",
};

export default async function DashboardPage() {
  // 1) Get the current session
  const session = await auth();

  // 2) If no session, redirect to login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 3) Extract userId from session
  const userId = Number(session.user.id);

  // 4) Fetch the latest plans for this user
  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    take: 10,
  });

  // 5) Group plans by type
  const dietPlans = plans.filter((p) => p.type === "DIET");
  const workoutPlans = plans.filter((p) => p.type === "WORKOUT");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Welcome back, {session.user?.email || "athlete"}. Here are your recent
          diet and workout plans.
        </p>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Link
            href="questionnaires/diet"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Create Diet Plan
          </Link>
          <Link
            href="/questionnaires/workout"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            Create Workout Plan
          </Link>
        </div>

        {/* SECTION: Diet Plans */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Diet Plans</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {dietPlans.length} plan{dietPlans.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {dietPlans.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
              <p className="text-sm text-zinc-500 mb-3">
                No diet plans yet.
              </p>
              <Link
                href="/diet"
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Create your first diet plan
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dietPlans.map((plan) => {
                const payload: any = plan.payload;
                const summary = payload.plan || payload;

                return (
                  <div
                    key={plan.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 mb-1">
                          Plan #{plan.id}
                        </p>
                        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                          {plan.title || "Diet Plan"}
                        </h3>
                      </div>
                      <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                        DIET
                      </span>
                    </div>

                    {/* Summary info */}
                    {summary?.totalCalories && summary?.proteinG && (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Calories:</span>
                          <span className="text-zinc-300 font-medium">
                            {summary.totalCalories.min}–{summary.totalCalories.max} kcal
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Protein:</span>
                          <span className="text-zinc-300 font-medium">
                            {summary.proteinG.min}–{summary.proteinG.max} g
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">
                        {new Date(plan.generatedAt).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION: Workout Plans */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Workout Plans</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {workoutPlans.length} plan{workoutPlans.length !== 1 ? 's' : ''}
            </span>
          </div>

          {workoutPlans.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
              <p className="text-sm text-zinc-500 mb-3">
                No workout plans yet.
              </p>
              <Link
                href="/workout"
                className="text-sm text-green-400 hover:text-green-300 underline"
              >
                Create your first workout plan
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workoutPlans.map((plan) => {
                const payload: any = plan.payload;
                const summary = payload;

                return (
                  <div
                    key={plan.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 mb-1">
                          Plan #{plan.id}
                        </p>
                        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                          {plan.title || "Workout Plan"}
                        </h3>
                      </div>
                      <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                        WORKOUT
                      </span>
                    </div>

                    {/* Summary info */}
                    {summary && (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Goal:</span>
                          <span className="text-zinc-300 font-medium">
                            {summary.goal}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Days/Week:</span>
                          <span className="text-zinc-300 font-medium">
                            {summary.daysPerWeek}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Level:</span>
                          <span className="text-zinc-300 font-medium capitalize">
                            {summary.fitnessLevel}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">
                        {new Date(plan.generatedAt).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-xs text-green-400 hover:text-green-300 underline font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}