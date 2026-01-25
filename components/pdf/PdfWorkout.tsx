export default function PdfWorkout({ plan }: { plan: any }) {
  if (!plan) return null;

  return (
    <>
      {plan.days.map((day: any, i: number) => (
        <section key={i} className="pdf-page">
          <h2 className="pdf-title">{day.dayLabel}</h2>
          <p className="pdf-value">{day.focus}</p>

          <h4>Warm-up</h4>
          <ul>{day.warmup.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>

          <h4>Exercises</h4>
          <ul>
            {day.exercises.map((ex: any, i: number) => (
              <li key={i}>
                {ex.name} — {ex.sets} sets — {ex.repsOrTime}
              </li>
            ))}
          </ul>

          <h4>Cooldown</h4>
          <ul>{day.cooldown.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
        </section>
      ))}
    </>
  );
}
