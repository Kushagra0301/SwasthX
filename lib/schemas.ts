import {z} from "zod";

export const DietRequestSchema = z.object({
    age: z.number().int().min(10).max(120),
    gender: z.enum(['MALE','FEMALE','OTHER']),
    weightKg : z.number().positive(),
    heightCm: z.number().int().positive(),
    activityLevel: z.enum(['SEDENTARY','LIGHT','MODERATE','VERY_ACTIVE','SUPER_ACTIVE']),
    goal: z.enum(['WEIGHT_LOSS','MUSCLE_GAIN','MAINTENANCE','ENDURANCE']),
    mealFrequency: z.number().int().min(1).max(10).optional().default(4),
    dietPreference: z.string().optional(),
    foodRestrictions: z.string().nullable().optional(),
    // optionally allow userId if logged-in (we'll accept null for now)
    userId: z.number().nullable().optional(),
});

export type DietRequest = z.infer<typeof DietRequestSchema>;

export const WorkoutRequestSchema  = z.object({
    gender: z.enum(['MALE','FEMALE','OTHER']),
    fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    goal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE']),
    location: z.enum(['HOME', 'GYM']),
    workoutTypes: z.array(z.enum(['STRENGTH', 'CARDIO', 'HIIT', 'BODYWEIGHT'])).nonempty(),
    daysPerWeek: z.number().int().min(1).max(7),
    userId: z.number().int().optional()
});

export type WorkoutRequest = z.infer<typeof WorkoutRequestSchema >;