export default function PdfDiet({ plan }: { plan: any }) {
  if (!plan) return null;

  return (
    <section className="pdf-page">
      <h2 className="pdf-title">Diet Plan</h2>

      <div className="pdf-section">
        <p className="pdf-label">Daily Calories</p>
        <p className="pdf-value">
          {plan.totalCalories.min} – {plan.totalCalories.max} kcal
        </p>
      </div>

      <div className="pdf-section">
        <p className="pdf-label">Macros</p>
        <ul>
          <li>Protein: {plan.proteinG.min}–{plan.proteinG.max} g</li>
          <li>Fat: {plan.fatG.min}–{plan.fatG.max} g</li>
          <li>Carbs: {plan.carbsG.min}–{plan.carbsG.max} g</li>
        </ul>
      </div>

      <div className="pdf-section">
        <p className="pdf-label">Per Meal Calories</p>
        <p className="pdf-value">
          {plan.perMeal.calories.min} – {plan.perMeal.calories.max} kcal
        </p>
      </div>
    </section>
  );
}
