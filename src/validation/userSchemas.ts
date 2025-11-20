import { z } from "zod";

export const updateHealthProfileSchema = z.object({
  birth_date: z.coerce.date(),
  gender: z.enum(["male", "female"]),
  height_cm: z.number().positive(),
  current_weight_kg: z.number().positive(),

  body_fat_percentage: z.number().optional(),
  waist_circumference_cm: z.number().optional(),
  hip_circumference_cm: z.number().optional(),
  neck_circumference_cm: z.number().optional(),

  activity_level_factor: z.number().positive(),
  steps_daily_average: z.number().int().optional(),
  sleep_hours_average: z.number().optional(),

  blood_glucose_fasting: z.number().int().optional(),
  hba1c: z.number().optional(),
  blood_pressure_systolic: z.number().int().optional(),
  blood_pressure_diastolic: z.number().int().optional(),
  cholesterol_ldl: z.number().optional(),
  cholesterol_hdl: z.number().optional(),
});

export type UpdateHealthProfileInput = z.infer<
  typeof updateHealthProfileSchema
>;

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
  })
  .refine(
    (data) => data.fullName || data.newPassword,
    "fullName or newPassword must be provided"
  )
  .refine(
    (data) => !data.newPassword || !!data.currentPassword,
    "currentPassword is required when changing password"
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const addFoodLogSchema = z.object({
  date: z.coerce.date(),
  time: z.string().min(1),
  foodItemId: z.string().min(1),
  quantity: z.number().positive(),
});

export type AddFoodLogInput = z.infer<typeof addFoodLogSchema>;

const primaryGoalEnum = z.enum([
  "weight_loss",
  "muscle_gain",
  "maintenance",
  "recomposition",
  "improve_endurance",
  "improve_health",
]);

const secondaryGoalEnum = z.enum([
  "better_sleep",
  "more_energy",
  "improve_mood",
  "improve_markers",
  "build_habits",
]);

const activityLevelEnum = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
]);

export const createGoalSchema = z.object({
  primary_goals: z.array(primaryGoalEnum).nonempty(),
  secondary_goals: z.array(secondaryGoalEnum).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  activity_level: activityLevelEnum,
  target_weight_kg: z.number().positive(),
  current_weight_kg: z.number().positive(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  primary_goals: z.array(primaryGoalEnum).nonempty().optional(),
  secondary_goals: z.array(secondaryGoalEnum).optional(),
  allergies: z.array(z.string()).optional(),
  activity_level: activityLevelEnum.optional(),
  target_weight_kg: z.number().positive().optional(),
  current_weight_kg: z.number().positive().optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const setCurrentGoalSchema = z.object({
  index: z.number().int().nonnegative(),
});

export type SetCurrentGoalInput = z.infer<typeof setCurrentGoalSchema>;
