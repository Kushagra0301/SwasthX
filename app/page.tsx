"use client";

import Link from "next/link";
import { FaFire, FaRunning, FaAppleAlt, FaDumbbell, FaHeartbeat, FaDownload, FaBolt, FaShieldAlt, FaUsers, FaStar } from "react-icons/fa";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* HERO SECTION */}
      <section className="relative max-w-6xl mx-auto px-6 py-24 text-center z-10 animate-fade-in">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            SwasthX
          </h1>
        </div>

        <p className="mt-6 text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Get a <span className="font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">personalized diet & workout plan</span>{" "}
          in under 60 seconds.
          <span className="block mt-2 text-lg text-zinc-400">
            No login. No OTP. No BS. Just results.
          </span>
        </p>

        {/* Animated Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
            <div className="text-2xl font-bold text-blue-400">100%</div>
            <div className="text-sm text-zinc-400">Free</div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
            <div className="text-2xl font-bold text-emerald-400">60s</div>
            <div className="text-sm text-zinc-400">Instant</div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
            <div className="text-2xl font-bold text-purple-400">PDF</div>
            <div className="text-sm text-zinc-400">Downloadable</div>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/questionnaires/diet"
            className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="flex items-center justify-center gap-3 relative z-10">
              <FaAppleAlt className="text-xl" />
              Generate Diet Plan
            </span>
          </Link>

          <Link
            href="/questionnaires/workout"
            className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden border border-zinc-800"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-white/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="flex items-center justify-center gap-3 relative z-10">
              <FaDumbbell className="text-xl" />
              Generate Workout Plan
            </span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-2 text-zinc-400">
            <FaShieldAlt className="text-emerald-400" />
            <span>No Sign-up Required</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <FaUsers className="text-blue-400" />
            <span>Community-Driven</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <FaStar className="text-amber-400" />
            <span>Made with ❤️ by Kushagra</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative max-w-6xl mx-auto px-6 pb-32 z-10">
        <div className="text-center mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works <span className="text-blue-400">✨</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Three simple steps to transform your health journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Lines */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
          
          <FeatureCard
            step="01"
            icon={<FaFire className="text-3xl text-orange-400" />}
            title="Answer Simple Questions"
            desc="Age, weight, goal, activity level — nothing complicated. We keep it simple so you can get started in seconds."
            delay="0.4s"
          />
          <FeatureCard
            step="02"
            icon={<FaBolt className="text-3xl text-yellow-400" />}
            title="Get Your Plan Instantly"
            desc="Personalized diet calories, macros, and workouts — generated in seconds using smart algorithms."
            delay="0.6s"
          />
          <FeatureCard
            step="03"
            icon={<FaDownload className="text-3xl text-emerald-400" />}
            title="Download & Follow"
            desc="Save the beautiful PDF. Share it with friends. Follow it daily. Watch your transformation begin."
            delay="0.8s"
          />
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative max-w-6xl mx-auto px-6 pb-32 z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose SwasthX? <span className="text-emerald-400">🚀</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Everything you need for a successful health journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureItem
            icon={<FaAppleAlt className="text-2xl text-emerald-400" />}
            title="Personalized Nutrition"
            desc="Custom meal plans based on your goals, preferences, and lifestyle."
            color="emerald"
          />
          <FeatureItem
            icon={<FaDumbbell className="text-2xl text-red-400" />}
            title="Smart Workouts"
            desc="AI-powered exercise routines that adapt to your fitness level and equipment."
            color="red"
          />
          <FeatureItem
            icon={<FaHeartbeat className="text-2xl text-pink-400" />}
            title="Progress Tracking"
            desc="Monitor your journey with detailed metrics and progress insights."
            color="pink"
          />
          <FeatureItem
            icon={<FaRunning className="text-2xl text-blue-400" />}
            title="Flexible Plans"
            desc="Workout from home or gym. Vegetarian or non-veg. We've got you covered."
            color="blue"
          />
          <FeatureItem
            icon={<FaUsers className="text-2xl text-purple-400" />}
            title="Community Driven"
            desc="Built for real people by real people. No corporate nonsense."
            color="purple"
          />
          <FeatureItem
            icon={<FaShieldAlt className="text-2xl text-amber-400" />}
            title="Privacy First"
            desc="No data selling. No spam. Just pure, helpful tools for your journey."
            color="amber"
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative max-w-4xl mx-auto px-6 pb-24 z-10">
        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-3xl border border-zinc-800/50 p-8 md:p-12 text-center backdrop-blur-sm">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Transform? <span className="text-blue-400">🔥</span>
          </h3>
          <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
            Join thousands who've already started their health journey with SwasthX. 
            It's free, instant, and actually works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/questionnaires/diet"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              🍽️ Start with Diet
            </Link>
            <Link
              href="/questionnaires/workout"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-900 hover:to-black transition-all duration-300 font-semibold text-lg border border-zinc-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              💪 Start with Workout
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/50 py-12 text-center relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-zinc-400 text-lg mb-6">
            Built with ❤️ for people who want <span className="text-emerald-300">results</span>, not confusion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500">
            <span>© {new Date().getFullYear()} SwasthX. All rights reserved.</span>
            <span className="hidden sm:block">•</span>
            <span>Made by Kushagra</span>
            <span className="hidden sm:block">•</span>
            <span>For the community, by the community</span>
          </div>
        </div>
      </footer>

      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
        }
      `}</style>
    </main>
  );
}

/* ---------- Feature Card Component ---------- */
function FeatureCard({
  step,
  icon,
  title,
  desc,
  delay,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: string;
}) {
  return (
    <div 
      className="relative group animate-slide-up" 
      style={{ animationDelay: delay || '0s' }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 border border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700/50 transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-300">{step}</span>
          </div>
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3 text-zinc-100">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">{desc}</p>
        
        {/* Decorative element */}
        <div className="mt-6 pt-6 border-t border-zinc-800/50">
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Feature Item Component ---------- */
function FeatureItem({
  icon,
  title,
  desc,
  color = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color?: "blue" | "emerald" | "red" | "pink" | "purple" | "amber";
}) {
  const colorClasses = {
    blue: "border-blue-500/20 hover:border-blue-500/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    red: "border-red-500/20 hover:border-red-500/40",
    pink: "border-pink-500/20 hover:border-pink-500/40",
    purple: "border-purple-500/20 hover:border-purple-500/40",
    amber: "border-amber-500/20 hover:border-amber-500/40",
  };

  return (
    <div className={`bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-2xl p-6 border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${colorClasses[color]}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-500/10' :
          color === 'emerald' ? 'bg-emerald-500/10' :
          color === 'red' ? 'bg-red-500/10' :
          color === 'pink' ? 'bg-pink-500/10' :
          color === 'purple' ? 'bg-purple-500/10' :
          'bg-amber-500/10'
        }`}>
          {icon}
        </div>
        <h4 className="text-lg font-semibold text-zinc-100">{title}</h4>
      </div>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}