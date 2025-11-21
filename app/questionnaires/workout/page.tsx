import WorkoutForm from '@/components/WorkoutForm';

export const metadata = {
  title: 'Workout Questionnaire — SwasthX',
};

export default function WorkoutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Workout Questionnaire
        </h1>
        <p className="mb-6 text-zinc-400 text-sm">
          Answer a few questions and SwasthX will generate a weekly workout plan
          tailored to your goal, fitness level, and schedule.
        </p>
        <WorkoutForm />
      </div>
    </main>
  );
}
