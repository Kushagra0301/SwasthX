import WorkoutForm from '@/components/WorkoutForm';

export const metadata = {
  title: 'Workout plan - SwasthX',
};

export default function WorkoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-24 md:px-8">
      <header className="mb-12 max-w-[52ch]">
        <h1 className="display-2">
          Tell us how you train.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Your level, your goal, where you train and how many days you can give
          it. The split is built around those four things.
        </p>
      </header>

      <WorkoutForm />
    </main>
  );
}
