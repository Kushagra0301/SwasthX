
import PdfDiet from "./PdfDiet";
import PdfWorkout from "./PdfWorkout";

type Props = {
  dietPlan: any;
  workoutPlan: any;
};

export default function PdfRoot({ dietPlan, workoutPlan }: Props) {
  return (
    <div id="pdf-root" className="pdf-root hidden">
      <PdfDiet plan={dietPlan} />
      <PdfWorkout plan={workoutPlan} />
    </div>
  );
}
