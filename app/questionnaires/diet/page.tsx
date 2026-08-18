import DietForm from '../../../components/DietForm';

export const metadata = {
  title: 'Diet Questionnaire — SwasthX',
};

export default function DietPage() {
  return (
    <main className="py-8">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Diet plan</p>
        <h1 className="font-display text-4xl font-semibold text-text">A few details, then your plan</h1>
        <p className="mt-3 text-lg text-text-muted">
          Fill out the form below to get a personalized diet plan tailored to your goals and preferences.
        </p>
      </div>

      <DietForm />
    </main>
  );
}
