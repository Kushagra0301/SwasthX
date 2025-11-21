import { buildWorkoutPlan } from '../lib/workout';
import { WorkoutInput } from '../lib/workout';

const input: WorkoutInput = {
  goal: 'WEIGHT_LOSS',
  fitnessLevel: 'BEGINNER',
  daysPerWeek: 4,
  location: 'HOME',
  workoutTypes: ['STRENGTH', 'CARDIO']
};

const plan = buildWorkoutPlan(input);
console.log(JSON.stringify(plan, null, 2));
