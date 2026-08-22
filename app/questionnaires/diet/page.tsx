import DietForm from '@/components/DietForm';

export const metadata = {
  title: 'Diet plan - SwasthX',
};

export default function DietPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-24 md:px-8">
      <header className="mb-12 max-w-[52ch]">
        <h1 className="display-2">
          Six questions, then your targets.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Everything below feeds the calculation. Nothing is stored on a server
          and nothing is sent anywhere except to work out your numbers.
        </p>
      </header>

      <DietForm />
    </main>
  );
}
