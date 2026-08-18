import { z } from "zod";

export const DietRequestSchema = z.object({
    age: z.number().int().min(10).max(120),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    weightKg: z.number().positive().max(400),
    heightCm: z.number().int().positive().max(280),
    activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'SUPER_ACTIVE']),
    goal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE']),
    dietPreference: z.enum(['VEG', 'NON_VEG']),
});

export type DietRequest = z.infer<typeof DietRequestSchema>;

export const WorkoutRequestSchema = z.object({
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    goal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE']),
    location: z.enum(['HOME', 'GYM']),
    workoutTypes: z.array(z.enum(['STRENGTH', 'CARDIO', 'HIIT', 'BODYWEIGHT'])).nonempty(),
    daysPerWeek: z.number().int().min(1).max(7),
});

export type WorkoutRequest = z.infer<typeof WorkoutRequestSchema>;
