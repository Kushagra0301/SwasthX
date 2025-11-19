import DietForm from '../../../components/DietForm';

export const metadata = {
  title: 'Diet Questionnaire — SwasthX',
};

export default function DietPage() {
  return (
    <main className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-100 mb-3">
            Diet Questionnaire
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Fill out the form below to receive a personalized diet plan tailored to your goals and preferences.
          </p>
        </div>

        <DietForm />
      </div>
    </main>
  );
}
