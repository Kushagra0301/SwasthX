import WorkoutForm from '@/components/WorkoutForm';

export const metadata = {
  title: 'Workout Questionnaire — SwasthX',
};

export default function WorkoutPage() {
  return (
    <main className="py-8">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Workout plan</p>
        <h1 className="font-display text-4xl font-semibold text-text">Build your weekly schedule</h1>
        <p className="mt-3 text-lg text-text-muted">
          Answer a few questions and SwasthX will generate a weekly workout plan tailored to your goal,
          fitness level, and schedule.
        </p>
      </div>

      <WorkoutForm />
    </main>
  );
}
